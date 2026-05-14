'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

type Slot = string

function calcularFeriados(ano: number): Set<string> {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const pascoa = (ano: number): Date => {
    const a = ano % 19
    const b = Math.floor(ano / 100)
    const c = ano % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1
    const dia = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(ano, mes, dia)
  }

  const addDias = (d: Date, n: number): Date => {
    const r = new Date(d)
    r.setDate(r.getDate() + n)
    return r
  }

  const p = pascoa(ano)

  return new Set<string>([
    `${ano}-01-01`,
    `${ano}-04-21`,
    `${ano}-05-01`,
    `${ano}-09-07`,
    `${ano}-10-12`,
    `${ano}-11-02`,
    `${ano}-11-15`,
    `${ano}-11-20`,
    `${ano}-12-25`,
    fmt(addDias(p, -48)),
    fmt(addDias(p, -47)),
    fmt(addDias(p, -46)),
    fmt(addDias(p, -2)),
    fmt(p),
    fmt(addDias(p, 60)),
    `${ano}-01-20`,
    `${ano}-04-23`,
  ])
}

export default function EscolherHorario() {
  const { servico_id, slug } = useParams()
  const searchParams = useSearchParams()
  const profissional_id = searchParams.get('profissional_id')
  const router = useRouter()

  const hoje = new Date()

  const [slots, setSlots] = useState<Slot[]>([])
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [duracao, setDuracao] = useState(60)
  const [loading, setLoading] = useState(false)
  const [mesAtual, setMesAtual] = useState(hoje.getMonth())
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear())

  useEffect(() => {
    fetch('/api-php/servicos.php')
      .then(r => r.json())
      .then(servicos => {
        const s = servicos.find((s: any) => s.id == servico_id)
        if (s) setDuracao(s.duracao_min)
      })
  }, [servico_id])

  useEffect(() => {
    if (!dataSelecionada || !profissional_id) return
    setLoading(true)
    setHorarioSelecionado('')
    fetch(`/api-php/horarios.php?profissional_id=${profissional_id}&data=${dataSelecionada}&duracao_min=${duracao}`)
      .then(r => r.json())
      .then(data => {
        setSlots(data)
        setLoading(false)
      })
  }, [dataSelecionada, duracao, profissional_id])

  const feriados = calcularFeriados(anoAtual)

  const gerarDias = () => {
    const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate()
    const dias = []
    for (let i = 1; i <= totalDias; i++) {
      dias.push(new Date(anoAtual, mesAtual, i))
    }
    return dias
  }

  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay()

  const podeIrAntes =
    anoAtual > hoje.getFullYear() ||
    (anoAtual === hoje.getFullYear() && mesAtual > hoje.getMonth())

  const formatarData = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const confirmar = () => {
    if (!horarioSelecionado || !dataSelecionada) return
    const dataHora = `${dataSelecionada} ${horarioSelecionado}:00`
    router.push(
      `/${slug}/agendar/${servico_id}/confirmar?profissional_id=${profissional_id}&data_hora=${encodeURIComponent(dataHora)}`
    )
  }

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      <button
        onClick={() => router.back()}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '13px', padding: '0',
          marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        ← Voltar
      </button>

      {/* Navegação do calendário */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '400' }}>Escolha a data</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              if (!podeIrAntes) return
              if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1) }
              else setMesAtual(m => m - 1)
            }}
            disabled={!podeIrAntes}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
              width: '32px', height: '32px', cursor: podeIrAntes ? 'pointer' : 'not-allowed',
              color: podeIrAntes ? 'var(--text)' : 'var(--border)', fontSize: '16px',
            }}
          >‹</button>
          <span style={{ fontSize: '14px', color: 'var(--muted)', minWidth: '130px', textAlign: 'center' }}>
            {meses[mesAtual]} {anoAtual}
          </span>
          <button
            onClick={() => {
              if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1) }
              else setMesAtual(m => m + 1)
            }}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer',
              color: 'var(--text)', fontSize: '16px',
            }}
          >›</button>
        </div>
      </div>

      {/* Cabeçalho dias da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '0.5rem' }}>
        {diasSemana.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '2rem' }}>
        {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
          <div key={`vazio-${i}`} />
        ))}
        {gerarDias().map(d => {
          const str = formatarData(d)
          const selecionado = str === dataSelecionada
          const ehFeriado = feriados.has(str)
          const passado = d < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
          const desabilitado = ehFeriado || passado

          return (
            <button
              key={str}
              onClick={() => !desabilitado && setDataSelecionada(str)}
              disabled={desabilitado}
              style={{
                padding: '10px 4px', borderRadius: '10px', border: '1px solid',
                borderColor: selecionado ? 'var(--accent)' : 'var(--border)',
                background: desabilitado ? 'transparent' : selecionado ? 'var(--accent-lt)' : 'var(--surface)',
                cursor: desabilitado ? 'not-allowed' : 'pointer',
                textAlign: 'center', transition: 'all 0.15s',
                opacity: desabilitado ? 0.35 : 1,
              }}
            >
              <p style={{
                fontSize: '13px',
                fontWeight: selecionado ? '500' : '400',
                color: selecionado ? 'var(--accent)' : 'var(--text)',
              }}>
                {d.getDate()}
              </p>
              {ehFeriado && (
                <p style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>fer.</p>
              )}
            </button>
          )
        })}
      </div>

      {/* Slots de horário */}
      {dataSelecionada && (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: '400', marginBottom: '1.5rem' }}>
            Horários disponíveis
          </h2>

          {loading ? (
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Buscando horários...</p>
          ) : slots.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Nenhum horário disponível neste dia.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '2rem' }}>
              {slots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setHorarioSelecionado(slot)}
                  style={{
                    padding: '12px 8px', borderRadius: '10px', border: '1px solid',
                    borderColor: horarioSelecionado === slot ? 'var(--accent)' : 'var(--border)',
                    background: horarioSelecionado === slot ? 'var(--accent-lt)' : 'var(--surface)',
                    color: horarioSelecionado === slot ? 'var(--accent)' : 'var(--text)',
                    fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          {horarioSelecionado && (
            <button
              onClick={confirmar}
              style={{
                width: '100%', padding: '14px',
                background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', cursor: 'pointer', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Continuar com {horarioSelecionado}
            </button>
          )}
        </>
      )}

    </main>
  )
}