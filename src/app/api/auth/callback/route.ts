import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getUserInfo } from '@/lib/secondme-api' // Assuming we'll create this
import { supabaseAdmin } from '@/lib/database'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    // 1. Exchange Code for Token (Second Me)
    const tokens = await exchangeCodeForToken(code)
    
    // 2. Fetch User Info from Second Me
    const secondMeUser = await getUserInfo(tokens.access_token)
    
    // 3. Sync with Supabase (Create or Update User)
    // Note: We use the Second Me ID as the primary key or link it
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        email: secondMeUser.email || `secondme_${secondMeUser.id}@placeholder.com`,
        nickname: secondMeUser.name,
        avatar: secondMeUser.avatar,
        secondme_id: secondMeUser.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' }) // Assuming email is unique, or better use a separate ID mapping
      .select()
      .single()

    if (userError) throw userError

    // 4. Ensure Agent Exists
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!agent) {
       await supabaseAdmin.from('agents').insert({
         user_id: user.id,
         name: `${secondMeUser.name}'s Agent`,
         level: 1,
         coins: 1000,
         credit_score: 100
       })
    }

    // 5. Create Session / Cookie (Simplified here, usually use NextAuth or Supabase Auth)
    // For now, redirect with a flag or token to client (In production, set HTTP-only cookie)
    
    const redirectUrl = new URL('/profile', request.url)
    // WARNING: Passing tokens in URL is not secure for production. Use cookies.
    // This is just for demonstration as requested.
    redirectUrl.searchParams.set('auth_success', 'true')
    
    const response = NextResponse.redirect(redirectUrl)
    
    // Set cookie for client-side usage (if needed)
    response.cookies.set('secondme_access_token', tokens.access_token, { httpOnly: true, secure: true })
    
    return response

  } catch (error: any) {
    console.error('OAuth sync error:', error.message)
    return NextResponse.redirect(new URL('/login?error=sync_failed', request.url))
  }
}
