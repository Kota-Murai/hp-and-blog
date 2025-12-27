import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')
  const isApiAdminPath = request.nextUrl.pathname.startsWith('/api/admin')

  // 本番環境では管理画面・管理APIを完全に無効化（404を返す）
  // ローカルでのみ管理機能を使用する運用
  if (process.env.NODE_ENV === 'production' && (isAdminPath || isApiAdminPath)) {
    return new NextResponse(null, { status: 404 })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // 管理画面へのアクセス制御（ローカル環境のみ有効）
  if (isAdminPath && !isLoginPage) {
    if (!user) {
      // 未認証の場合はログインページにリダイレクト
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    // 管理者メールアドレスのチェック
    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (!allowedEmails.includes(user.email || '')) {
      // 管理者でない場合はログインページにリダイレクト
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  // ログイン済みでログインページにアクセスした場合は管理画面にリダイレクト
  if (isLoginPage && user) {
    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (allowedEmails.includes(user.email || '')) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}

