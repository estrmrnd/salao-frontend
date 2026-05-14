'use client'

import { useEffect, useState } from 'react'
import AdminNav from '../../components/AdminNav'

type Servico = { id: number; nome: string }

type Profissional = {
  id: number
  nome: string
  especialidade: string
  foto_url: string | null
  ativo: boolean
  servicos: Servico[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--surface)', color: 'var(--text)',
  fontSize: '14px', fontFamily: 'inherit',
}

const vazio: Omit<Profissional, 'servicos'> & { servicos: number[] } = {
  id: 0, nome: '', especialidade: '', foto_url: null, ativo: true, servicos: [],
}

function iniciaisDe(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function AdminProfissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(vazio)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const buscar = () => {
    setLoading(true)
    Promise.all([
      fetch('/api-php/profissionais.php?todos').then(r => r.json()),
      fetch('/api-php/servicos.php').then(r => r.json()),
    ]).then(([p, s]) => {
      setProfissionais(p)
      setServicos(s)
      setLoading(false)
    })
  }

  useEffect(() => { buscar() }, [])

  const abrirNovo = () => {
    setForm(vazio)
    setEditando(true)
    setErro('')
  }

  const abrirEditar = (p: Profissional) => {
    setForm({ ...p, servicos: p.servicos.map(s => s.id) })
    setEditando(true)
    setErro('')
  }

  const cancelar = () => {
    setEditando(false)
    setForm(vazio)
    setErro('')
  }

  const toggleServico = (id: number) => {
    setForm(f => ({
      ...f,
      servicos: f.servicos.includes(id)
        ? f.servicos.filter(s => s !== id)
        : [...f.servicos, id],
    }))
  }

  const salvar = async () => {
    setErro('')
    if (!form.nome.trim()) {
      setErro('Nome é obrigatório.')
      return
    }
    setSalvando(true)
    const metodo = form.id ? 'PUT' : 'POST'
    const res = await fetch('/api-php/profissionais.php', {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSalvando(false)
    if (!res.ok) {
      const data = await res.json()
      setErro(data.erro ?? 'Erro ao salvar.')
      return
    }
    buscar()
    cancelar()
  }

  const toggleAtivo = async (p: Profissional) => {
    await fetch('/api-php/profissionais.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...p,
        ativo: !p.ativo,
        servicos: p.servicos.map(s => s.id),
      }),
    })
    buscar()
  }

  return (
    <>
      <AdminNav />
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'normal' }}>Profissionais</h1>
          {!editando && (
            <button
              onClick={abrirNovo}
              style={{
                padding: '8px 18px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              }}
            >
              + Nova profissional
            </button>
          )}
        </div>

        {/* Formulário */}
        {editando && (
          <div style={{
            border: '1px solid var(--border)', borderRadius: '12px',
            padding: '1.5rem', marginBottom: '2rem', background: 'var(--surface)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1.25rem' }}>
              {form.id ? 'Editar profissional' : 'Nova profissional'}
            </p>

            {erro && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1rem',
              }}>{erro}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Nome</label>
                <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Especialidade</label>
                <input style={inputStyle} value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} placeholder="Ex: Sobrancelhas e PMU" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>URL da foto (opcional)</label>
                <input style={inputStyle} value={form.foto_url ?? ''} onChange={e => setForm(f => ({ ...f, foto_url: e.target.value }))} placeholder="https://..." />
              </div>

              {form.id !== 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Status</label>
                  <select style={inputStyle} value={form.ativo ? '1' : '0'} onChange={e => setForm(f => ({ ...f, ativo: e.target.value === '1' }))}>
                    <option value="1">Ativa</option>
                    <option value="0">Inativa</option>
                  </select>
                </div>
              )}
            </div>

            {/* Serviços que realiza */}
            <div style={{ marginTop: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
                Serviços que realiza
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {servicos.map(s => {
                  const marcado = form.servicos.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleServico(s.id)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                        borderColor: marcado ? 'var(--accent)' : 'var(--border)',
                        background: marcado ? 'var(--accent-lt)' : 'transparent',
                        color: marcado ? 'var(--accent)' : 'var(--muted)',
                        fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {s.nome}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button onClick={cancelar} style={{ padding: '9px 18px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando} style={{ padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando...</p>
        ) : profissionais.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Nenhuma profissional cadastrada.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {profissionais.map(p => (
              <div
                key={p.id}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  opacity: p.ativo ? 1 : 0.5,
                }}
              >
                {/* Avatar */}
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nome} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-lt)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '13px', fontWeight: '500', color: 'var(--accent)',
                  }}>
                    {iniciaisDe(p.nome)}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>{p.nome}</p>
                    {!p.ativo && (
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'var(--border)', color: 'var(--muted)' }}>
                        Inativa
                      </span>
                    )}
                  </div>
                  {p.especialidade && (
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>{p.especialidade}</p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {p.servicos.map(s => (
                      <span key={s.id} style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                        background: 'var(--accent-lt)', color: 'var(--accent)',
                        border: '1px solid var(--border)',
                      }}>
                        {s.nome}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => abrirEditar(p)}
                    style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(p)}
                    style={{
                      padding: '6px 14px', border: '1px solid', borderRadius: '8px',
                      fontSize: '12px', cursor: 'pointer',
                      borderColor: p.ativo ? '#f5b8b8' : '#9dc4ae',
                      background: p.ativo ? '#fdf0f0' : '#edf5f0',
                      color: p.ativo ? '#9b2c2c' : '#1a4d35',
                    }}
                  >
                    {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}