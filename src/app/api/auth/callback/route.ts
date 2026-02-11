import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getSecondMeUserInfo } from '@/app/actions/oauth2'
import { supabaseAdmin } from '@/lib/database'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  console.log('[Callback] Received request:', { hasCode: !!code, state: state?.substring(0, 10) + '...' })

  if (!code) {
    console.error('[Callback] No code in request')
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    console.log('[Callback] Exchanging code for token...')
    const tokens = await exchangeCodeForToken(code, state || '')

    if (!tokens) {
      console.error('[Callback] Token exchange returned null')
      throw new Error('Failed to exchange code for token')
    }

    console.log('[Callback] Token exchange successful, fetching user info...')
    const secondMeUser = await getSecondMeUserInfo(tokens.accessToken)
    if (!secondMeUser) {
      console.error('[Callback] User info returned null')
      throw new Error('Failed to get user info')
    }

    console.log('[Callback] 用户数据:', {
      userId: secondMeUser.userId,
      name: secondMeUser.name,
      shadesCount: secondMeUser.shades?.length || 0,
      softMemoryCount: secondMeUser.softMemory?.length || 0,
    })

    const userData: any = {
      secondme_id: secondMeUser.userId,
      nickname: secondMeUser.name,
      avatar: secondMeUser.avatar,
      updated_at: new Date().toISOString()
    }

    // SecondMe API 返回的 shades 可能是 { shades: [] } 或 []
    // 需要确保数据库收到的是纯数组
    const shadesValue: any = secondMeUser.shades
    if (Array.isArray(shadesValue)) {
      userData.shades = shadesValue
    } else if (shadesValue && typeof shadesValue === 'object' && Array.isArray((shadesValue as any).shades)) {
      userData.shades = (shadesValue as any).shades
    } else {
      userData.shades = []
    }

    if (secondMeUser.softMemory && secondMeUser.softMemory.length > 0) {
      userData.soft_memory = secondMeUser.softMemory
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(userData, { onConflict: 'secondme_id' })
      .select()
      .single()

    if (userError) {
      console.error('[Callback] Database error:', userError)
      if (userError.message?.includes('column') || userError.message?.includes('schema')) {
        console.log('[Callback] Retrying without soft_memory column...')
        const { data: retryUser, error: retryError } = await supabaseAdmin
          .from('users')
          .upsert({
            secondme_id: secondMeUser.userId,
            nickname: secondMeUser.name,
            avatar: secondMeUser.avatar,
            shades: secondMeUser.shades || [],
            updated_at: new Date().toISOString()
          }, { onConflict: 'secondme_id' })
          .select()
          .single()
        
        if (retryError) throw retryError
        return processUserData(retryUser!, tokens, secondMeUser)
      }
      throw userError
    }
    console.log('[Callback] User synced to database:', user.id)
    
    return processUserData(user, tokens, secondMeUser)
  } catch (error: any) {
    console.error('[Callback] OAuth callback error:', error)
    console.error('[Callback] Error stack:', error.stack)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }
}

async function processUserData(user: any, tokens: any, secondMeUser: any) {
  const { data: agent, error: agentError } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!agent && !agentError) {
    console.log('[Callback] Creating new agent...')
     await supabaseAdmin.from('agents').insert({
       user_id: user.id,
       name: `${secondMeUser.name}'s Agent`,
       level: 1,
       coins: 1000,
       credit_score: 100
     })
  } else {
    console.log('[Callback] Agent exists:', agent?.id)
  }

  const redirectUrl = new URL('/?auth_success=true', 'http://localhost:3000')
  const response = NextResponse.redirect(redirectUrl)

  response.cookies.set('secondme_access_token', tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7200 })
  response.cookies.set('secondme_refresh_token', tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2592000 })
  response.cookies.set('user_id', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2592000 })
  response.cookies.set('auth_session', 'active', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7200 })

  console.log('[Callback] Redirecting to home with cookies set')
  return response
}
