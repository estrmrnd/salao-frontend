'use client'

import { useEffect, useState } from 'react'
import AdminNav from '../../components/AdminNav'

type Categoria = { id: number; nome: string }

type Servico = {
  id: number
  nome: string
  descricao: string
  preco: string
  duracao_min: number
  categoria: string
  categoria_id: number
  ativo: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--surface)', color: 'var(--text)',
  fontSize: '14px', fontFamily: 'inherit',
}

const vazio = { id: 0, nome: '', descricao: '', preco: '', duracao_min: 60, categoria: '', categoria_id: 0, ativo: true }

export default function AdminServicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Servico>(vazio)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [filtroCat, setFiltroCat] = useState('Todos')

  const buscar = () => {
    setLoading(true)
    Promise.all([
      fetch('/api-php/servicos.php').then(r => r.json()),
      fetch('/api-php/categorias.php').then(r => r.json()),
    ]).then(([s, c]) => {
      setServicos(s)
      setCategorias(c)
      setLoading(false)
    })
  }

  useEffect(() => { buscar() }, [])

  const abrirNovo = () => {
    setForm(vazio)
    setEditando(true)
    setErro('')
  }

  const abrirEditar = (s: Servico) => {
    setForm(s)
    setEditando(true)
    setErro('')
  }

  const cancelar = () => {
    setEditando(false)
    setForm(vazio)
    setErro('')
  }

  const salvar = async () => {
    setErro('')
    if (!form.nome || !form.preco || !form.duracao_min || !form.categoria_id) {
      setErro('Preencha nome, categoria, preço e duração.')
      return
    }
    setSalvando(true)
    const metodo = form.id ? 'PUT' : 'POST'
    const res = await fetch('/api-php/servicos.php', {
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

  const toggleAtivo = async (s: Servico) => {
    await fetch('/api-php/servicos.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, ativo: !s.ativo }),
    })
    buscar()
  }

  const cats = ['Todos', ...categorias.map(c => c.nome)]
  const filtrados = filtroCat === 'Todos' ? servicos : servicos.filter(s => s.categoria === filtroCat)

  return (
    <>
      <AdminNav />
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'normal' }}>Serviços</h1>
          {!editando && (
            <button
              onClick={abrirNovo}
              style={{
                padding: '8px 18px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              }}
            >
              + Novo serviço
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
              {form.id ? 'Editar serviço' : 'Novo serviço'}
            </p>

            {erro && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1rem',
              }}>{erro}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Nome</label>
                <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Design de sobrancelhas" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Categoria</label>
                <select
                  style={inputStyle}
                  value={form.categoria_id}
                  onChange={e => setForm(f => ({ ...f, categoria_id: Number(e.target.value) }))}
                >
                  <option value={0}>Selecione...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Duração (min)</label>
                <input style={inputStyle} type="number" min={5} step={5} value={form.duracao_min} onChange={e => setForm(f => ({ ...f, duracao_min: Number(e.target.value) }))} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Preço (R$)</label>
                <input style={inputStyle} type="number" min={0} step={0.01} value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="0,00" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Status</label>
                <select style={inputStyle} value={form.ativo ? '1' : '0'} onChange={e => setForm(f => ({ ...f, ativo: e.target.value === '1' }))}>
                  <option value="1">Ativo</option>
                  <option value="0">Inativo</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '5px' }}>Descrição (opcional)</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição breve do serviço" />
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

        {/* Filtro por categoria */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {cats.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCat(cat)}
              style={{
                padding: '5px 14px', borderRadius: '20px', border: '1px solid',
                borderColor: filtroCat === cat ? 'var(--accent)' : 'var(--border)',
                background: filtroCat === cat ? 'var(--accent-lt)' : 'transparent',
                color: filtroCat === cat ? 'var(--accent)' : 'var(--muted)',
                fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{cat}</button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Nenhum serviço encontrado.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtrados.map(s => (
              <div
                key={s.id}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '1rem 1.25rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  opacity: s.ativo ? 1 : 0.5,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>{s.nome}</p>
                    {!s.ativo && (
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'var(--border)', color: 'var(--muted)' }}>
                        Inativo
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {s.categoria} · {s.duracao_min} min · R$ {parseFloat(s.preco).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => abrirEditar(s)}
                    style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(s)}
                    style={{
                      padding: '6px 14px', border: '1px solid', borderRadius: '8px',
                      fontSize: '12px', cursor: 'pointer',
                      borderColor: s.ativo ? '#f5b8b8' : '#9dc4ae',
                      background: s.ativo ? '#fdf0f0' : '#edf5f0',
                      color: s.ativo ? '#9b2c2c' : '#1a4d35',
                    }}
                  >
                    {s.ativo ? 'Desativar' : 'Ativar'}
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