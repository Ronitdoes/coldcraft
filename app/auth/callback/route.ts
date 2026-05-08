import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const redirectTo = (path: string) => {
    const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
      // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      return NextResponse.redirect(`${origin}${path}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${path}`)
    }

    return NextResponse.redirect(`${origin}${path}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Auth callback user lookup error:', userError)
        return redirectTo('/login?error=true')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Auth callback profile lookup error:', profileError)
        return redirectTo('/login?error=true')
      }

      const next = profile ? '/dashboard' : '/onboarding/resume'
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth callback routing decision:', {
          userId: user.id,
          hasProfile: Boolean(profile),
          next,
        })
      }

      return redirectTo(next)
    }
  }

  // return the user to an error page with instructions
  return redirectTo('/login?error=true')
}
