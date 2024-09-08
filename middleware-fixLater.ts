// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//   const path = request.nextUrl.pathname

//   // Define public paths that don't require authentication
//   const isPublicPath = path === '/' || path === '/login' || path === '/signup' || path === '/about'

//   // Get the token from the cookies
//   const token = request.cookies.get('token')?.value || ''

//   // If the path is not public and there's no token, redirect to login
//   if (!isPublicPath && !token) {
//     return NextResponse.redirect(new URL('/login', request.url))
//   }

//   // If the user is logged in and tries to access login or signup, redirect to home
//   if (token && (path === '/login' || path === '/signup')) {
//     return NextResponse.redirect(new URL('/', request.url))
//   }
// }

// // See "Matching Paths" below to learn more
// export const config = {
//   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
// }