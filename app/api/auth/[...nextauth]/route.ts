import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'Email e senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null

        const res = await fetch('http://localhost/salao/api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            senha: credentials.senha,
          }),
        })

        if (!res.ok) return null

        const admin = await res.json()
        if (!admin?.id) return null

        return {
          id: String(admin.id),
          name: admin.nome,
          email: admin.email,
          salaoId: admin.salao_id,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.salaoId = (user as any).salaoId ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).salaoId = token.salaoId ?? null
      }
      return session
    },
  },

  pages: {
    signIn: '/admin/login',
  },

  session: {
    strategy: 'jwt',
  },
})

export { handler as GET, handler as POST }