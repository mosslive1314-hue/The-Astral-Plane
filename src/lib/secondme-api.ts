export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.SECONDME_CLIENT_ID
  const clientSecret = process.env.SECONDME_CLIENT_SECRET
  const redirectUri = process.env.SECONDME_REDIRECT_URI

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri!,
    client_id: clientId!,
    client_secret: clientSecret!
  })

  const res = await fetch(`${process.env.SECONDME_API_BASE_URL}/api/oauth/token/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('Token exchange failed:', errorText)
    throw new Error('Failed to exchange token')
  }

  const result = await res.json()

  if (result.code !== 0) {
    throw new Error(`Token error: ${result.message || 'Unknown error'}`)
  }

  const tokenData = result.data

  return {
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken,
    token_type: tokenData.tokenType,
    expires_in: tokenData.expiresIn,
    scope: tokenData.scope
  }
}

export async function getUserInfo(accessToken: string) {
  const res = await fetch(`${process.env.SECONDME_API_BASE_URL}/api/secondme/user/info`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!res.ok) {
    throw new Error('Failed to fetch user info')
  }

  const json = await res.json()

  if (json.code !== 0) {
    throw new Error(`User info error: ${json.message || 'Unknown error'}`)
  }

  const userData = json.data

  return {
    id: userData.id || 'unknown_id',
    name: userData.name,
    email: userData.email,
    avatar: userData.avatar,
    bio: userData.bio
  }
}

export async function getUserShades(accessToken: string) {
  const res = await fetch(`${process.env.SECONDME_API_BASE_URL}/api/secondme/user/shades`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!res.ok) return []

  const json = await res.json()

  if (json.code !== 0) return []

  return json.data || []
}

export async function getUserSoftMemory(accessToken: string) {
  const res = await fetch(`${process.env.SECONDME_API_BASE_URL}/api/secondme/user/soft-memory`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!res.ok) return []

  const json = await res.json()

  if (json.code !== 0) return []

  return json.data || []
}

export async function chatWithAgent(accessToken: string, message: string) {
  const res = await fetch(`${process.env.SECONDME_API_BASE_URL}/api/secondme/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'second-me-agent',
      messages: [
        { role: 'user', content: message }
      ],
      stream: false
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to chat with agent')
  }

  return res.json()
}
