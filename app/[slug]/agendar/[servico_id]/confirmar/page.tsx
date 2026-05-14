'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

type Servico = { id: number; nome: string; duracao_min: number; preco: number }
type Profissional = { id: number; nome: string }

function formatarDataHora(str: string) {
  const [data, hora] = str.split(' ')
  const [ano, mes, dia] = data.split('-')
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia))
  return `${diasSemana[d.getDay()]}, ${dia} de ${meses[Number(mes) - 1]}. de ${ano} às ${hora.slice(0, 5)}`
}

function gerarGoogleCalLink(nome: string, descricao: string, dataHoraStr: string, durMin: number) {
  const [data, hora] = dataHoraStr.split(' ')
  const [ano, mes, dia] = data.split('-')
  const [h, m] = hora.split(':')
  const pad = (v: number) => String(v).padStart(2, '0')
  const inicio = new Date(Number(ano), Number(mes) - 1, Number(dia), Number(h), Number(m))
  const fim = new Date(inicio.getTime() + durMin * 60000)
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(nome)}` +
    `&dates=${fmt(inicio)}/${fmt(fim)}` +
    `&details=${encodeURIComponent(descricao)}`
  )
}

function gerarIcs(nome: string, descricao: string, dataHoraStr: string, durMin: number) {
  const [data, hora] = dataHoraStr.split(' ')
  const [ano, mes, dia] = data.split('-')
  const [h, m] = hora.split(':')
  const pad = (v: number) => String(v).padStart(2, '0')
  const inicio = new Date(Number(ano), Number(mes) - 1, Number(dia), Number(h), Number(m))
  const fim = new Date(inicio.getTime() + durMin * 60000)
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const uid = `salon-${Date.now()}@agendamento`
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Salão//Agendamento//PT',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${fmt(inicio)}`,
    `DTEND:${fmt(fim)}`,
    `SUMMARY:${nome}`,
    `DESCRIPTION:${descricao}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics)
}

export default function ConfirmarAgendamento() {
  const { servico_id, slug } = useParams()
  const searchParams = useSearchParams()
  const profissionalId = searchParams.get('profissional_id') ?? ''
  const dataHora = searchParams.get('data_hora') ?? ''

  const [servico, setServico] = useState<Servico | null>(null)
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [gcalLink, setGcalLink] = useState('')
  const [icsLink, setIcsLink] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api-php/servicos.php').then(r => r.json()),
      fetch('/api-php/profissionais.php').then(r => r.json()),
    ]).then(([servicos, profissionais]) => {
      const s = servicos.find((s: Servico) => s.id == servico_id)
      const p = profissionais.find((p: Profissional) => p.id == profissionalId)
      if (s) setServico(s)
      if (p) setProfissional(p)
    })
  }, [servico_id, profissionalId])

  const confirmar = async () => {
    setErro('')
    if (!nome.trim() || !telefone.trim()) {
      setErro('Preencha nome e telefone para continuar.')
      return
    }
    setLoading(true)
    try {
      const resCliente = await fetch('/api-php/clientes.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), telefone: telefone.trim(), email: email.trim() }),
      })
      const cliente = await resCliente.json()
      if (!resCliente.ok || !cliente.id) throw new Error(cliente.erro ?? 'Erro ao cadastrar cliente.')

      const resAg = await fetch('/api-php/agendamento.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: cliente.id,
          profissional_id: profissionalId,
          servico_id,
          data_hora: dataHora,
          observacao: obs.trim(),
        }),
      })
      const ag = await resAg.json()
      if (!resAg.ok) throw new Error(ag.erro ?? 'Erro ao confirmar agendamento.')

      const titulo = `Agendamento — ${servico?.nome ?? 'Serviço'}`
      const descricao = `Serviço: ${servico?.nome}\nProfissional: ${profissional?.nome}`
      const durMin = servico?.duracao_min ?? 60
      setGcalLink(gerarGoogleCalLink(titulo, descricao, dataHora, durMin))
      setIcsLink(gerarIcs(titulo, descricao, dataHora, durMin))
      setSucesso(true)
    } catch (e: any) {
      setErro(e.message ?? 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    const whatsappMsg = encodeURIComponent(
      `Olá! Acabei de confirmar meu agendamento:\n\n` +
      `📅 ${formatarDataHora(dataHora)}\n` +
      `✂️ Serviço: ${servico?.nome}\n` +
      `👩 Profissional: ${profissional?.nome}\n` +
      `💰 Valor: R$ ${Number(servico?.preco).toFixed(2).replace('.', ',')}`
    )

    return (
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--accent-lt)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
          }}>
            <svg width="28" height="28" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '500', marginBottom: '8px' }}>
            Agendamento confirmado!
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            {formatarDataHora(dataHora)} com {profissional?.nome ?? 'o profissional selecionado'}.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href={gcalLink} target="_blank" rel="noopener noreferrer" style={calBtnStyle}>
            <CalIconGoogle />
            <div>
              <p style={{ fontWeight: '500', fontSize: '14px' }}>Adicionar ao Google Calendar</p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Abre direto no seu calendário Google
              </p>
            </div>
          </a>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>ou</p>

          <a href={icsLink} download="agendamento.ics" style={calBtnStyle}>
            <CalIconIcs />
            <div>
              <p style={{ fontWeight: '500', fontSize: '14px' }}>Adicionar ao Apple Calendar / Outlook</p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Baixa o arquivo .ics — funciona no iOS também
              </p>
            </div>
          </a>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>ou</p>

          <a href={`https://wa.me/5521985449151?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" style={whatsappBtnStyle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.37-.22-3.87.99 1.02-3.76-.24-.38A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.44-7.3c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.19-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.17 5.06 4.45.71.3 1.26.49 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.19-.57-.34z" fill="#25D366"/>
            </svg>
            <div>
              <p style={{ fontWeight: '500', fontSize: '14px' }}>Enviar confirmação pelo WhatsApp</p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Abre o WhatsApp com os detalhes do agendamento
              </p>
            </div>
          </a>
        </div>

        <button
          onClick={() => window.location.href = `/${slug}`}
          style={{
            width: '100%', marginTop: '1.5rem', padding: '12px',
            border: '1px solid var(--border)', background: 'none',
            borderRadius: '12px', fontSize: '14px', color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          Fazer novo agendamento
        </button>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button
        onClick={() => window.history.back()}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '13px', padding: '0',
          marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        ← Voltar
      </button>

      <div style={{
        border: '1px solid var(--border)', borderRadius: '12px',
        padding: '1.25rem 1.5rem', marginBottom: '2rem',
      }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: '1rem' }}>
          Resumo do agendamento
        </p>
        {[
          ['Serviço', servico?.nome ?? '—'],
          ['Profissional', profissional?.nome ?? '—'],
          ['Data e hora', dataHora ? formatarDataHora(dataHora) : '—'],
          ['Duração', servico ? `${servico.duracao_min} min` : '—'],
          ['Valor', servico ? `R$ ${Number(servico.preco).toFixed(2).replace('.', ',')}` : '—'],
        ].map(([label, valor], i, arr) => (
          <div
            key={label}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              fontSize: '14px',
            }}
          >
            <span style={{ color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontWeight: '500' }}>{valor}</span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '16px', fontWeight: '400', marginBottom: '1.25rem' }}>Seus dados</h2>

      {erro && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          borderRadius: '8px', padding: '12px 14px', fontSize: '14px', marginBottom: '1.25rem',
        }}>
          {erro}
        </div>
      )}

      {[
        { label: 'Nome completo *', id: 'nome', type: 'text', value: nome, set: setNome, placeholder: 'Seu nome' },
        { label: 'Telefone *', id: 'tel', type: 'tel', value: telefone, set: setTelefone, placeholder: '(21) 99999-9999' },
        { label: 'E-mail', id: 'email', type: 'email', value: email, set: setEmail, placeholder: 'seu@email.com' },
      ].map(f => (
        <div key={f.id} style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '6px' }}>
            {f.label}
          </label>
          <input
            type={f.type}
            value={f.value}
            onChange={e => f.set(e.target.value)}
            placeholder={f.placeholder}
            style={inputStyle}
          />
        </div>
      ))}

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '6px' }}>
          Observação (opcional)
        </label>
        <textarea
          value={obs}
          onChange={e => setObs(e.target.value)}
          placeholder="Ex: prefiro atendimento com música ambiente"
          style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
        />
      </div>

      {loading && (
        <p style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', marginBottom: '1rem' }}>
          Confirmando agendamento...
        </p>
      )}

      <button
        onClick={confirmar}
        disabled={loading}
        style={{
          width: '100%', padding: '14px',
          background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '12px',
          fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
        }}
      >
        {loading ? 'Aguarde...' : 'Confirmar agendamento'}
      </button>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--surface)', color: 'var(--text)',
  fontSize: '14px', fontFamily: 'inherit',
}

const calBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '14px',
  padding: '13px 18px', borderRadius: '12px',
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text)', textDecoration: 'none', cursor: 'pointer',
}

const whatsappBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '14px',
  padding: '13px 18px', borderRadius: '12px',
  border: '1px solid #a8dbb8', background: '#e7f5ec',
  color: '#1a6b3a', textDecoration: 'none', cursor: 'pointer',
}

function CalIconGoogle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="12" y="19" textAnchor="middle" fontSize="7" fontWeight="500" fill="currentColor">G</text>
    </svg>
  )
}

function CalIconIcs() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 15l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}