import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only run Supabase session refresh if env vars are configured
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && key && !url.includes('your-project')) {
    const { updateSession } = await import('@/lib/supabase/middleware')
    return await updateSession(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
