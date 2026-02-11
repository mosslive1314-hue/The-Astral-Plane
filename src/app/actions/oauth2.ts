'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SECONDME_OAUTH_URL = 'https://go.second.me/oauth'
const SECONDME_TOKEN_URL = 'https://app.mindos.com/gate/lab/api/oauth/token'
const SECONDME_API_URL = 'https://app.mindos.com/gate/lab/api/secondme'

const CLIENT_ID = process.env.SECONDME_CLIENT_ID!
const CLIENT_SECRET = process.env.SECONDME_CLIENT_SECRET!
const REDIRECT_URI = process.env.SECONDME_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'

export interface OAuth2TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  scope: string[]
}

export interface SecondMeUserInfo {
  userId: string
  name: string
  bio?: string
  avatar?: string
  shades?: string[]
  softMemory?: any[]
}

function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

export async function buildAuthorizationUrl(state?: string): Promise<string> {
  const oauthState = state || generateState()
  
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', oauthState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  })
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    state: oauthState,
  })
  
  return `${SECONDME_OAUTH_URL}/?${params.toString()}`
}

export async function exchangeCodeForToken(code: string, state: string): Promise<OAuth2TokenResponse | null> {
  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value
  
  if (!savedState || savedState !== state) {
    console.error('[OAuth2] State验证失败')
    return null
  }
  
  try {
    const response = await fetch(SECONDME_TOKEN_URL + '/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
    })
    
    const data = await response.json()
    
    if (data.code !== 0) {
      console.error('[OAuth2] Token交换失败:', data.message)
      return null
    }
    
    cookieStore.delete('oauth_state')
    
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      tokenType: data.data.tokenType,
      expiresIn: data.data.expiresIn,
      scope: data.data.scope || [],
    }
  } catch (error) {
    console.error('[OAuth2] Token交换异常:', error)
    return null
  }
}

export async function getSecondMeUserInfo(accessToken: string): Promise<SecondMeUserInfo | null> {
  try {
    const response = await fetch(`${SECONDME_API_URL}/user/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    const data = await response.json()
    console.log('[SecondMe API] User info complete response:', JSON.stringify(data))
    
    if (data.code !== 0) {
      console.error('[SecondMe API] 获取用户信息失败:', data.message)
      return null
    }
    
    const userInfo: SecondMeUserInfo = {
      userId: data.data.userId,
      name: data.data.name,
      bio: data.data.bio,
      avatar: data.data.avatar,
      shades: Array.isArray(data.data.shades) ? data.data.shades : [],
      softMemory: Array.isArray(data.data.softMemory) ? data.data.softMemory : []
    }

    console.log('[SecondMe API] 用户数据解析完成:', {
      userId: userInfo.userId,
      name: userInfo.name,
      shadesCount: userInfo.shades?.length || 0,
      softMemoryCount: userInfo.softMemory?.length || 0
    })

    return userInfo
  } catch (error) {
    console.error('[SecondMe API] 获取用户信息异常:', error)
    return null
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuth2TokenResponse | null> {
  try {
    const response = await fetch(SECONDME_TOKEN_URL + '/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
    })
    
    const data = await response.json()
    
    if (data.code !== 0) {
      console.error('[OAuth2] Token刷新失败:', data.message)
      return null
    }
    
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      tokenType: data.data.tokenType,
      expiresIn: data.data.expiresIn,
      scope: data.data.scope || [],
    }
  } catch (error) {
    console.error('[OAuth2] Token刷新异常:', error)
    return null
  }
}

export async function initiateOAuth2Login() {
  const authUrl = await buildAuthorizationUrl()
  redirect(authUrl)
}
