'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Salao = { id: number; nome: string; slug: string; logo_url: string | null }
type Servico = {
  id: number
  nome: string
  descricao: string
  preco: string
  duracao_min: number
  categoria: string
  ativo: string
}

export default function PaginaSalao() {
  const { slug } = useParams()
  const router = useRouter()
  const [salao, setSalao] = useState<Salao | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos')

  useEffect(() => {
    fetch(`/api-php/salao.php?slug=${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(s => {
        setSalao(s)
        return fetch(`/api-php/servicos.php?salao_id=${s.id}`)
      })
      .then(r => r.json())
      .then(data => {
        setServicos(data.filter((s: Servico) => s.ativo === '1'))
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  const categorias = ['Todos', ...Array.from(new Set(servicos.map(s => s.categoria)))]
  const filtrados = categoriaSelecionada === 'Todos'
    ? servicos
    : servicos.filter(s => s.categoria === categoriaSelecionada)

  if (loading) return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando...</p>
    </main>
  )

  if (notFound) return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '18px', marginBottom: '8px' }}>Salão não encontrado</p>
      <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Verifique o link e tente novamente.</p>
    </main>
  )

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '12px', letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
          {salao?.nome}
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 'normal', letterSpacing: '-0.01em' }}>
          PMU, Estética & Cosmetologia
        </h1>
        <p style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>
          Escolha o serviço desejado para iniciar seu agendamento.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaSelecionada(cat)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: '1px solid',
              borderColor: categoriaSelecionada === cat ? 'var(--accent)' : 'var(--border)',
              background: categoriaSelecionada === cat ? 'var(--accent-lt)' : 'transparent',
              color: categoriaSelecionada === cat ? 'var(--accent)' : 'var(--muted)',
              fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando serviços...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtrados.map(s => (
            <div
              key={s.id}
              onClick={() => router.push(`/${slug}/agendar/${s.id}`)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '1.25rem 1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div>
                <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>{s.nome}</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{s.duracao_min} min</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '16px', color: 'var(--accent)' }}>
                  R$ {parseFloat(s.preco).toFixed(2)}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Agendar →</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}