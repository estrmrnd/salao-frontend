'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import AdminNav from '../components/AdminNav'

type Agendamento = {
  id: number
  data_hora: string
  duracao_min: number
  preco_cobrado: string
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado'
  cliente: string
  profissional: string
  servico: string
}

const statusLabel: Record<string, string> = {
  pendente:   'Pendente',
  confirmado: 'Confirmado',
  concluido:  'Concluído',
  cancelado:  'Cancelado',
}

const statusColor: Record<string, { bg: string; color: string; border: string }> = {
  pendente:   { bg: '#fdf6ec', color: '#92580a', border: '#f5d79e' },
  confirmado: { bg: '#edf7f0', color: '#1a6b3a', border: '#a8dbb8' },
  concluido:  { bg: '#f0ece8', color: '#6b4f3a', border: '#c9b8ac' },
  cancelado:  { bg: '#fdf0f0', color: '#9b2c2c', border: '#f5b8b8' },
}

const periodos = [
  { label: 'Dia',    valor: 'dia'    },
  { label: 'Semana', valor: 'semana' },
  { label: 'Mês',    valor: 'mes'    },
  { label: 'Ano',    valor: 'ano'    },
]

function formatarHora(str: string) {
  return str.split(' ')[1]?.slice(0, 5) ?? ''
}

function formatarDataCurta(str: string) {
  const [data] = str.split(' ')
  const [ano, mes, dia] = data.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${diasSemana[d.getDay()]}, ${dia} ${meses[mes - 1]}`
}

function formatarDataExtenso(str: string) {
  const [data] = str.split(' ')
  const [ano, mes, dia] = data.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  const diasSemana = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${diasSemana[d.getDay()]}, ${dia} de ${meses[mes - 1]} de ${ano}`
}

function tituloPeriodo(periodo: string, dataFiltro: string) {
  const agora = new Date()
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  if (periodo === 'semana') return `Semana atual`
  if (periodo === 'mes')    return `${meses[agora.getMonth()]} de ${agora.getFullYear()}`
  if (periodo === 'ano')    return `Ano de ${agora.getFullYear()}`
  return formatarDataExtenso(dataFiltro + ' 00:00')
}

function hoje() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading]           = useState(true)
  const [dataFiltro, setDataFiltro]     = useState(hoje())
  const [periodo, setPeriodo]           = useState('dia')
  const [atualizando, setAtualizando]   = useState<number | null>(null)

  // ── Push notification ──
  const pendentesRef = useRef<number | null>(null)

  // Pede permissão de notificação ao abrir o painel
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Polling a cada 30s: detecta novos pendentes e dispara push
  useEffect(() => {
    const checar = async () => {
  try {
    const r = await fetch(`/api-php/agendamento.php?periodo=ano`)
    const dados: Agendamento[] = await r.json()
    const novos = dados.filter(a => a.status === 'pendente').length

    if (pendentesRef.current !== null && novos > pendentesRef.current) {
      const diff = novos - pendentesRef.current
      if (Notification.permission === 'granted') {
        new Notification('Novo agendamento! 💇', {
          body: `Você tem ${diff} novo${diff > 1 ? 's' : ''} pedido${diff > 1 ? 's' : ''} pendente${diff > 1 ? 's' : ''}.`,
          icon: '/favicon.ico',
        })
      }
      if (periodo === 'dia' && dataFiltro === hoje()) {
        setAgendamentos(dados)
      }
    }

    pendentesRef.current = novos
  } catch {
    // silencioso
  }
}
    checar()
    const intervalo = setInterval(checar, 30_000)
    return () => clearInterval(intervalo)
  }, [periodo, dataFiltro])

  // ── Busca principal ──
  const buscar = (data: string, p: string) => {
    setLoading(true)
    const url = p === 'dia'
      ? `/api-php/agendamento.php?data=${data}`
      : `/api-php/agendamento.php?periodo=${p}`

    fetch(url)
      .then(r => r.json())
      .then(data => { setAgendamentos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { buscar(dataFiltro, periodo) }, [dataFiltro, periodo])

  const atualizarStatus = async (id: number, status: string) => {
    setAtualizando(id)
    await fetch('/api-php/agendamento.php', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    buscar(dataFiltro, periodo)
    setAtualizando(null)
  }

  const ativos      = agendamentos.filter(a => a.status !== 'cancelado')
  const faturamento = ativos
    .filter(a => a.status === 'concluido')
    .reduce((acc, a) => acc + parseFloat(a.preco_cobrado), 0)
  const pendentes   = agendamentos.filter(a => a.status === 'pendente').length
  const confirmados = agendamentos.filter(a => a.status === 'confirmado').length

  const metricaStyle = (bg: string, color: string): React.CSSProperties => ({
    background:   bg,
    border:       `1px solid ${color}`,
    borderRadius: '12px',
    padding:      '1rem 1.25rem',
    flex:         1,
    minWidth:     '140px',
  })

  return (
    <main style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <AdminNav />

      {/* Seletor de período */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
        {periodos.map(p => (
          <button
            key={p.valor}
            onClick={() => setPeriodo(p.valor)}
            style={{
              padding:    '6px 16px',
              fontSize:   '13px',
              borderRadius: '20px',
              cursor:     'pointer',
              border:     periodo === p.valor ? '1px solid #c4a898' : '1px solid var(--border)',
              background: periodo === p.valor ? '#f0ece8'           : 'transparent',
              color:      periodo === p.valor ? '#4a3020'           : 'var(--muted)',
              fontWeight: periodo === p.valor ? '500'               : 'normal',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filtro de data — só aparece no modo Dia */}
      {periodo === 'dia' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <button
            onClick={() => {
              const d = new Date(dataFiltro + 'T12:00:00')
              d.setDate(d.getDate() - 1)
              setDataFiltro(d.toISOString().split('T')[0])
            }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text)', fontSize: '16px' }}
          >‹</button>

          <input
            type="date"
            value={dataFiltro}
            onChange={e => setDataFiltro(e.target.value)}
            style={{
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '6px 12px', fontSize: '13px', color: 'var(--text)',
              background: 'var(--surface)', fontFamily: 'inherit', cursor: 'pointer',
            }}
          />

          <button
            onClick={() => {
              const d = new Date(dataFiltro + 'T12:00:00')
              d.setDate(d.getDate() + 1)
              setDataFiltro(d.toISOString().split('T')[0])
            }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text)', fontSize: '16px' }}
          >›</button>

          {dataFiltro !== hoje() && (
            <button
              onClick={() => setDataFiltro(hoje())}
              style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', padding: '0' }}
            >
              Hoje
            </button>
          )}
        </div>
      )}

      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.5rem' }}>
        {tituloPeriodo(periodo, dataFiltro)}
      </p>

      {/* Métricas */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={metricaStyle('#f5f0eb', '#d4b99a')}>
          <p style={{ fontSize: '11px', color: '#8c7260', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Agendamentos</p>
          <p style={{ fontSize: '26px', fontWeight: '500', color: '#5c3d2e' }}>{ativos.length}</p>
        </div>
        <div style={metricaStyle('#edf5f0', '#9dc4ae')}>
          <p style={{ fontSize: '11px', color: '#3d6b52', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Confirmados</p>
          <p style={{ fontSize: '26px', fontWeight: '500', color: '#1a4d35' }}>{confirmados}</p>
        </div>
        <div style={metricaStyle('#fdf6ec', '#e8c98a')}>
          <p style={{ fontSize: '11px', color: '#8c5e10', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Pendentes</p>
          <p style={{ fontSize: '26px', fontWeight: '500', color: '#7a4e0a' }}>{pendentes}</p>
        </div>
        <div style={metricaStyle('#f0ece8', '#c4a898')}>
          <p style={{ fontSize: '11px', color: '#6b4f3a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Faturamento</p>
          <p style={{ fontSize: '26px', fontWeight: '500', color: '#4a3020' }}>
            R$ {faturamento.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Lista de agendamentos */}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando...</p>
      ) : agendamentos.length === 0 ? (
        <div style={{
          border: '1px solid var(--border)', borderRadius: '12px',
          padding: '2.5rem', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Nenhum agendamento para este período.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {agendamentos.map(a => {
            const sc = statusColor[a.status]
            return (
              <div
                key={a.id}
                style={{
                  background:    'var(--surface)',
                  border:        '1px solid var(--border)',
                  borderRadius:  '12px',
                  padding:       '1rem 1.25rem',
                  display:       'flex',
                  gap:           '1rem',
                  alignItems:    'flex-start',
                }}
              >
                {/* Hora */}
                <div style={{ minWidth: '44px', textAlign: 'center', paddingTop: '2px' }}>
                  {periodo !== 'dia' && (
                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>
                      {formatarDataCurta(a.data_hora)}
                    </p>
                  )}
                  <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--accent)' }}>
                    {formatarHora(a.data_hora)}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {a.duracao_min}min
                  </p>
                </div>

                {/* Divisor vertical */}
                <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <p style={{ fontSize: '15px', fontWeight: '500' }}>{a.cliente}</p>
                    <span style={{
                      fontSize: '11px', fontWeight: '500',
                      padding: '3px 10px', borderRadius: '20px',
                      background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    }}>
                      {statusLabel[a.status]}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    {a.servico} · {a.profissional}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--accent)', marginTop: '4px' }}>
                    R$ {parseFloat(a.preco_cobrado).toFixed(2).replace('.', ',')}
                  </p>

                  {/* Ações de status */}
                  {a.status !== 'cancelado' && a.status !== 'concluido' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {a.status === 'pendente' && (
                        <button
                          onClick={() => atualizarStatus(a.id, 'confirmado')}
                          disabled={atualizando === a.id}
                          style={{
                            padding: '5px 14px', fontSize: '12px', cursor: 'pointer',
                            border: '1px solid #9dc4ae', borderRadius: '6px',
                            background: '#edf5f0', color: '#1a4d35',
                          }}
                        >
                          Confirmar
                        </button>
                      )}
                      {a.status === 'confirmado' && (
                        <button
                          onClick={() => atualizarStatus(a.id, 'concluido')}
                          disabled={atualizando === a.id}
                          style={{
                            padding: '5px 14px', fontSize: '12px', cursor: 'pointer',
                            border: '1px solid #c4a898', borderRadius: '6px',
                            background: '#f0ece8', color: '#4a3020',
                          }}
                        >
                          Concluir
                        </button>
                      )}
                      <button
                        onClick={() => atualizarStatus(a.id, 'cancelado')}
                        disabled={atualizando === a.id}
                        style={{
                          padding: '5px 14px', fontSize: '12px', cursor: 'pointer',
                          border: '1px solid #f5b8b8', borderRadius: '6px',
                          background: '#fdf0f0', color: '#9b2c2c',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}