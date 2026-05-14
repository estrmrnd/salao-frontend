'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {useSession, signOut } from 'next-auth/react'

const links = [
  { href: '/admin',              label: 'Agenda'       },
  { href: '/admin/servicos',     label: 'Serviços'     },
  { href: '/admin/profissionais',label: 'Profissionais'},
  { href: '/admin/bloqueios',    label: 'Bloqueios'    },
]



export default function AdminNav() {
  const path = usePathname()
  const { data: session } = useSession()

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      marginBottom: '2.5rem',
      paddingBottom: '0',
    }}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '1.25rem 1.5rem 0' }}>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '3px' }}>
              Ticy Martins
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text)' }}>Painel admin</p>
            <h1 style={{ fontSize: '22px', fontWeight: 'normal' }}>
            Olá, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '7px 14px',
              fontSize: '13px', color: 'var(--muted)', cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {links.map(l => {
            const ativo = path === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  textDecoration: 'none',
                  borderRadius: '8px 8px 0 0',
                  borderTop: ativo ? '1px solid var(--border)' : '1px solid transparent',
                  borderLeft: ativo ? '1px solid var(--border)' : '1px solid transparent',
                  borderRight: ativo ? '1px solid var(--border)' : '1px solid transparent',
                  borderBottom: ativo ? '1px solid var(--surface)' : '1px solid transparent',
                  marginBottom: ativo ? '-1px' : '0',
                  background: ativo ? 'var(--surface)' : 'transparent',
                  color: ativo ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: ativo ? '500' : '400',
                  transition: 'color 0.15s',
                }}
              >
                {l.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}