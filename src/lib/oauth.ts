import { API_CONFIG } from './constants'

export function getOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: API_CONFIG.CLIENT_ID,
    redirect_uri: API_CONFIG.REDIRECT_URI,
    response_type: 'code',
    scope: 'user.info user.info.shades chat note.add',
  })

  return `${API_CONFIG.OAUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string) {
  console.log('[OAuth] Exchanging code for token...')
  console.log('[OAuth] Code:', code.substring(0, 20) + '...')

  // 使用 application/x-www-form-urlencoded 格式（OAuth2 标准）
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: API_CONFIG.REDIRECT_URI,
    client_id: API_CONFIG.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET || '',
  })

  console.log('[OAuth] Request params:', {
    grant_type: 'authorization_code',
    code: code.substring(0, 20) + '...',
    redirect_uri: API_CONFIG.REDIRECT_URI,
    client_id: API_CONFIG.CLIENT_ID,
    client_secret: '***',
  })

  try {
    // 使用正确的端点: /api/oauth/token/code
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/oauth/token/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    console.log('[OAuth] Response status:', response.status)

    // 只读取一次 response body
    const responseData = await response.json()
    console.log('[OAuth] Response:', JSON.stringify(responseData).substring(0, 200) + '...')

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${JSON.stringify(responseData)}`)
    }

    // SecondMe API 响应格式: { code: 0, data: { accessToken, refreshToken, ... } }
    if (responseData.code !== 0) {
      throw new Error(`API error: ${responseData.message || 'Unknown error'}`)
    }

    // 转换为标准 OAuth2 格式
    const tokens = {
      access_token: responseData.data.accessToken,
      refresh_token: responseData.data.refreshToken,
      expires_in: responseData.data.expiresIn,
      token_type: responseData.data.tokenType,
    }

    console.log('[OAuth] Token exchange success!')
    return tokens
  } catch (error: any) {
    console.error('[OAuth] Token exchange error:', error.message)
    throw error
  }
}

export async function getUserInfo(accessToken: string) {
  console.log('[OAuth] Fetching user info...')

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/secondme/user/info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  console.log('[OAuth] User info response status:', response.status)

  const responseData = await response.json()
  console.log('[OAuth] User info response:', JSON.stringify(responseData).substring(0, 200))

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status} ${JSON.stringify(responseData)}`)
  }

  if (responseData.code !== 0) {
    throw new Error(`API error: ${responseData.message || 'Failed to fetch user info'}`)
  }

  // 转换为我们的用户格式
  return {
    id: responseData.data.userId,
    nickname: responseData.data.name,
    email: responseData.data.email,
    avatar: responseData.data.avatar,
    bio: responseData.data.bio,
  }
}

export async function getUserShades(accessToken: string) {
  console.log('[OAuth] Fetching user shades...')

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/secondme/user/shades`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  console.log('[OAuth] User shades response status:', response.status)

  if (!response.ok) {
    // 如果获取失败，不抛出异常，而是返回空数组，避免阻断主流程
    console.warn('Failed to fetch user shades')
    return []
  }

  const responseData = await response.json()
  
  if (responseData.code !== 0) {
    console.warn(`API error fetching shades: ${responseData.message}`)
    return []
  }

  // 假设 API 返回的结构是 { data: string[] }
  return responseData.data || []
}
