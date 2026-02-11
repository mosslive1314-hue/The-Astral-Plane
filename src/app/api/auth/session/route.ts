import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('secondme_access_token')
  const refreshToken = cookieStore.get('secondme_refresh_token')
  const userId = cookieStore.get('user_id')

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    accessToken: accessToken.value,
    refreshToken: refreshToken.value,
    userId: userId?.value
  })
}
