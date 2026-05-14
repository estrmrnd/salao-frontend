'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Profissional = {
  id: number; nome: string; especialidade: string; foto_url: string | null
  servicos: { id: number; nome: string; preco: string; duracao_min: number }[]
}
type Servico = { id: number; nome: string; preco: string; duracao_min: number; categoria: string }
type Salao = { id: number; nome: string; slug: string }

export default function EscolherProfissional() {
  const { slug, servico_id } = useParams()
  const router = useRouter()
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [servico, setServico] = useState<Servico | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api-php/salao.php?slug=${slug}`)
      .then(r => r.json())
      .then((salao: Salao) =>
        Promise.all([
          fetch(`/api-php/profissionais.php?servico_id=${servico_id}&salao_id=${salao.id}`).then(r => r.json()),
          fetch(`/api-php/servicos.php?salao_id=${salao.id}`).then(r => r.json()),
        ])
      )
      .then(([profs, servicos]) => {
        setServico(servicos.find((s: Servico) => s.id == servico_id))
        setProfissionais(profs)
        setLoading(false)
      })
  }, [slug, servico_id])

  const iniciais = (nome: string) =>
    nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={() => router.back()} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted)', fontSize: '13px', padding: '0',
        marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '6px',
      }}>← Voltar</button>

      {servico && (
        <div style={{
          background: 'var(--accent-lt)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
              Serviço selecionado
            </p>
            <p style={{ fontSize: '15px', fontWeight: '500' }}>{servico.nome}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '16px', color: 'var(--accent)' }}>R$ {parseFloat(servico.preco).toFixed(2)}</p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{servico.duracao_min} min</p>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '18px', fontWeight: '400', marginBottom: '1.5rem' }}>Escolha a profissional</h2>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando...</p>
      ) : profissionais.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Nenhuma profissional disponível para este serviço.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {profissionais.map(p => (
            <div key={p.id}
              onClick={() => router.push(`/${slug}/agendar/${servico_id}/horario?profissional_id=${p.id}`)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'var(--accent-lt)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '500', color: 'var(--accent)', flexShrink: 0,
              }}>
                {iniciais(p.nome)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '3px' }}>{p.nome}</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{p.especialidade}</p>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: '18px' }}>→</span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}