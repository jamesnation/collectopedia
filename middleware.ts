import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/my-collection(.*)", "/settings(.*)"]);

// Static assets that can be cached for longer periods
const isStaticAsset = createRouteMatcher([
  "/(.+)\\.(jpg|jpeg|png|gif|svg|ico|webp|avif|css|js|woff|woff2)",
  "/_next/static/(.*)",
  "/_next/image(.*)",
]);

// Pages that can be cached for a short time
const isCacheablePage = createRouteMatcher([
  "/",
  "/catalog(.*)",
  "/items(.*)",
  "/(marketing)(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = auth();
  const pathname = req.nextUrl.pathname;
  let response = NextResponse.next();

  // Extra security check for middleware subrequests to protect against bypass vulnerability
  if (req.headers.get('x-middleware-subrequest') && isProtectedRoute(req) && !userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Cache static assets more aggressively
  if (isStaticAsset(req)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
    return response;
  }

  // Add shorter caching for public pages
  if (isCacheablePage(req) && !userId) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
    );
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: "/login" });
  }

  // If the user is logged in and the route is protected, let them view.
  if (userId && isProtectedRoute(req)) {
    return response;
  }

  return response;
});

// Updated matcher configuration with more secure patterns
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(api|trpc)(.*)'
  ]
};
