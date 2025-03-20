import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Store recent requests to detect patterns
const recentRequests: {
  path: string;
  method: string;
  timestamp: number;
  headers?: Record<string, string>;
  referer?: string;
}[] = [];

// Maximum number of requests to track
const MAX_TRACKED_REQUESTS = 100;

// Time window to consider for detecting rapid requests (ms)
const RAPID_REQUEST_WINDOW = 5000;

// Count threshold to consider as rapid requests
const RAPID_REQUEST_THRESHOLD = 5;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const fullPath = `${pathname}${search}`;
  
  // Special handling for POST requests to /my-collection
  if (method === 'POST' && pathname === '/my-collection') {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';
    const contentType = request.headers.get('content-type') || 'none';
    
    // Always log these requests for debugging
    console.warn(`🔍 DETECTED POST to /my-collection | Referer: ${referer} | Content-Type: ${contentType}`);
    
    // Track session for this request
    const cookies = request.cookies.toString();
    console.warn(`🔍 Cookies: ${cookies.substring(0, 50)}...`);
    
    // Try to capture request payload for debugging (only for JSON)
    if (contentType.includes('application/json')) {
      request.clone().json().then(body => {
        console.warn(`🔍 Request body:`, JSON.stringify(body).substring(0, 200) + '...');
      }).catch(err => {
        console.warn(`🔍 Could not parse request body:`, err.message);
      });
    }
  }
  
  // Add current request to history with more details
  recentRequests.push({
    path: fullPath,
    method,
    timestamp: Date.now(),
    referer: request.headers.get('referer') || undefined,
    headers: {
      'content-type': request.headers.get('content-type') || 'none',
      'user-agent': request.headers.get('user-agent')?.substring(0, 50) || 'unknown'
    }
  });
  
  // Keep only the most recent requests
  if (recentRequests.length > MAX_TRACKED_REQUESTS) {
    recentRequests.shift();
  }
  
  // Detect rapid repeated requests to the same endpoint
  const now = Date.now();
  const recentWindow = now - RAPID_REQUEST_WINDOW;
  
  // Count requests to this path in the time window
  const recentSamePathRequests = recentRequests.filter(req => 
    req.path === fullPath && 
    req.method === method && 
    req.timestamp > recentWindow
  );
  
  // Log if we detect rapid requests
  if (recentSamePathRequests.length >= RAPID_REQUEST_THRESHOLD) {
    console.warn(
      `⚠️ DETECTED RAPID REQUESTS: ${recentSamePathRequests.length} ${method} requests to ${fullPath} in the last ${RAPID_REQUEST_WINDOW/1000} seconds`
    );
    
    // Group by referer to help identify the source
    const refererCounts: Record<string, number> = {};
    recentSamePathRequests.forEach(req => {
      const referer = req.referer || 'unknown';
      refererCounts[referer] = (refererCounts[referer] || 0) + 1;
    });
    
    console.warn(`Referer breakdown:`, refererCounts);
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Only match POST requests and the my-collection path
    {
      source: '/(.*)',
      has: [{ type: 'header', key: 'content-type', value: 'application/json' }]
    },
    '/my-collection'
  ],
}; 