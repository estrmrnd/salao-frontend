import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const isLoginPage = req.nextUrl.pathname === '/admin/login'

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}