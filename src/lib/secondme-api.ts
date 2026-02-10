
const SECONDME_API_BASE = 'https://api.second.me/api/v1'

export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.SECONDME_CLIENT_ID
  const clientSecret = process.env.SECONDME_CLIENT_SECRET
  const redirectUri = process.env.SECONDME_REDIRECT_URI

  const res = await fetch('https://auth.second.me/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('Token exchange failed:', errorText)
    throw new Error('Failed to exchange token')
  }

  return res.json()
}

export async function getUserInfo(accessToken: string) {
  const res = await fetch(`${SECONDME_API_BASE}/user/info`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!res.ok) {
    throw new Error('Failed to fetch user info')
  }

  const json = await res.json()
  // Adapt to your app's user structure
  return {
    id: json.data.id || 'unknown_id', // Ensure ID exists
    name: json.data.name,
    email: json.data.email, // Might need extra scope
    avatar: json.data.avatar,
    bio: json.data.bio
  }
}

export async function getUserShades(accessToken: string) {
    const res = await fetch(`${SECONDME_API_BASE}/user/shades`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
  
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  }

export async function getUserSoftMemory(accessToken: string) {
  // Hypothetical endpoint based on docs description
  const res = await fetch(`${SECONDME_API_BASE}/user/soft-memory`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!res.ok) return []
  const json = await res.json()
  return json.data || []
}

export async function chatWithAgent(accessToken: string, message: string) {
    const res = await fetch(`${SECONDME_API_BASE}/chat/completions`, {
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
        stream: false, // For simplicity in this helper
      }),
    });
    
    if (!res.ok) {
        throw new Error('Failed to chat with agent')
    }

    return res.json()
}
