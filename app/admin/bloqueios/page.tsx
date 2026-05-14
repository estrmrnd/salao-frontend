'use client'

import { useEffect, useState } from 'react'
import AdminNav from '../../components/AdminNav'

type Profissional = { id: number; nome: string }

type Bloqueio = {
  id: number
  data: string
  inicio: string
  fim: string
  motivo: string
  profissional_id: number | null
  profissional: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--surface)', color: 'var(--text)',
  fontSize: '14px', fontFamily: 'inherit',
}

function formatarData(str: string) {
  const [ano, mes, dia] = str.split('-')
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${dia} de ${meses[Number(mes) - 1]}. de ${ano}`
}

function ehDiaInteiro(inicio: string, fim: string) {
  return inicio.startsWith('00:00') && fim.startsWith('23:59')
}

export default function AdminBloqueios() {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [removendo, setRemovendo] = useState<number | null>(null)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    profissional_id: '',
    data: '',
    dia_inteiro: true,
    inicio: '09:00',
    fim: '18:00',
    motivo: '',
  })

  const buscar = () => {
    setLoading(true)
    Promise.all([
      fetch('/api-php/bloqueios.php').then(r => r.json()),
      fetch('/api-php/profissionais.php?todos').then(r => r.json()),
    ]).then(([b, p]) => {
      setBloqueios(b)
      setProfissionais(p)
      setLoading(false)
    })
  }

  useEffect(() => { buscar() }, [])

  const salvar = async () => {
    setErro('')
    if (!form.data) {
      setErro('Selecione uma data.')
      return
    }
    if (!form.dia_inteiro && (!form.inicio || !form.fim)) {
      setErro('Informe o horário de início e fim.')
      return
    }
    setSalvando(true)
    const res = await fetch('/api-php/bloqueios.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        profissional_id: form.profissional_id ? Number(form.profissional_id) : null,
      }),
    })
    setSalvando(false)
    if (!res.ok) {
      const data = await res.json()
      setErro(data.erro ?? 'Erro ao salvar.')
      return
    }
    buscar()
    setCriando(false)
    setForm({ profissional_id: '', data: '', dia_inteiro: true, inicio: '09:00', fim: '18:00', motivo: '' })
  }

  const remover = async (id: number) => {
    setRemovendo(id)
    await fetch('/api-php/bloqueios.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    buscar()
    setRemovendo(null)
  }

  // Agrupa bloqueios por data
  const porData = bloqueios.reduce<Record<string, Bloqueio[]>>((acc, b) => {
    acc[b.data] = acc[b.data] ?? []
    acc[b.data].push(b)
    return acc
  }, {})

  const hoje = new Date().toISOString().split('T')[0]
  const datasOrdenadas = Object.keys(porData).sort()
  const futuros = datasOrdenadas.filter(d => d >= hoje)
  const passados = datasOrdenadas.filter(d => d < hoje)

  return (
    <>
      <AdminNav />
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'normal' }}>Bloqueios</h1>
          {!criando && (
            <button
              onClick={() => { setCriando(true); setErro('') }}
              style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
            >
              + Novo bloqueio
            </button>
          )}
        </div>

        {/* Formulário */}
        {criando && (
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', background: 'var(--surface)' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1.25rem' }}>Novo bloqueio</p>

            {erro && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1rem' }}>
                {erro}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Profissional</label>
                <select style={inputStyle} value={form.profissional_id} onChange={e => setForm(f => ({ ...f, profissional_id: e.target.value }))}>
                  <option value="">Salão inteiro</option>
                  {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Data</label>
                <input type="date" style={inputStyle} value={form.data} min={hoje} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Tipo de bloqueio</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ label: 'Dia inteiro', value: true }, { label: 'Período', value: false }].map(op => (
                    <button
                      key={String(op.value)}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, dia_inteiro: op.value }))}
                      style={{
                        padding: '7px 16px', borderRadius: '20px', border: '1px solid',
                        borderColor: form.dia_inteiro === op.value ? 'var(--accent)' : 'var(--border)',
                        background: form.dia_inteiro === op.value ? 'var(--accent-lt)' : 'transparent',
                        color: form.dia_inteiro === op.value ? 'var(--accent)' : 'var(--muted)',
                        fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {!form.dia_inteiro && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Início</label>
                    <input type="time" style={inputStyle} value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Fim</label>
                    <input type="time" style={inputStyle} value={form.fim} onChange={e => setForm(f => ({ ...f, fim: e.target.value }))} />
                  </div>
                </>
              )}

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Motivo (opcional)</label>
                <input style={inputStyle} value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Ex: Feriado, consulta médica..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setCriando(false)} style={{ padding: '9px 18px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando} style={{ padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar bloqueio'}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando...</p>
        ) : bloqueios.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Nenhum bloqueio cadastrado.</p>
        ) : (
          <>
            {futuros.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '12px' }}>Próximos</p>
                {futuros.map(data => (
                  <GrupoBloqueio key={data} data={data} bloqueios={porData[data]} removendo={removendo} onRemover={remover} />
                ))}
              </div>
            )}
            {passados.length > 0 && (
              <div style={{ opacity: 0.5 }}>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '12px' }}>Passados</p>
                {passados.slice(-5).reverse().map(data => (
                  <GrupoBloqueio key={data} data={data} bloqueios={porData[data]} removendo={removendo} onRemover={remover} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}

function GrupoBloqueio({ data, bloqueios, removendo, onRemover }: {
  data: string
  bloqueios: Bloqueio[]
  removendo: number | null
  onRemover: (id: number) => void
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>{formatarData(data)}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {bloqueios.map(b => (
          <div key={b.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>
                {b.profissional ?? 'Salão inteiro'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {ehDiaInteiro(b.inicio, b.fim)
                  ? 'Dia inteiro'
                  : `${b.inicio.slice(0, 5)} – ${b.fim.slice(0, 5)}`}
                {b.motivo ? ` · ${b.motivo}` : ''}
              </p>
            </div>
            <button
              onClick={() => onRemover(b.id)}
              disabled={removendo === b.id}
              style={{
                padding: '5px 12px', border: '1px solid #f5b8b8',
                borderRadius: '8px', background: '#fdf0f0', color: '#9b2c2c',
                fontSize: '12px', cursor: 'pointer', opacity: removendo === b.id ? 0.5 : 1,
              }}
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}