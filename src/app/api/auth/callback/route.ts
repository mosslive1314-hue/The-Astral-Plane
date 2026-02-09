import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/oauth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    const tokens = await exchangeCodeForToken(code)

    // 重定向回主页，带上 token
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('access_token', tokens.access_token)
    redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)

    return NextResponse.redirect(redirectUrl)
  } catch (error: any) {
    console.error('OAuth error:', error.message)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }
}
