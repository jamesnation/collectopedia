/**
 * Debug Fetch Tracker Component
 * 
 * Tracks and detects problematic React Query and fetch operations
 */

'use client';

import { useEffect, useState } from 'react';

// List of observed requests
type ObservedRequest = {
  url: string;
  method: string;
  timestamp: number;
  stack?: string;
};

// Keep a global record to persist between re-renders
const recentRequests: ObservedRequest[] = [];
const MAX_REQUESTS = 100;

export default function DebugFetchTracker() {
  const [isActive, setIsActive] = useState(true);
  const [stats, setStats] = useState<{
    totalRequests: number;
    uniqueUrls: number;
    postRequests: number;
  }>({
    totalRequests: 0,
    uniqueUrls: 0,
    postRequests: 0,
  });

  useEffect(() => {
    if (!isActive) return;

    // Hook into the fetch API
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      // Determine URL and method from input
      let url: string;
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input instanceof Request) {
        url = input.url;
      } else {
        // Fallback for any other type
        url = String(input);
      }
      
      // Determine method
      const method = init?.method || 
        (input instanceof Request ? input.method : 'GET');
      
      // Only track my-collection requests
      if (url.includes('/my-collection')) {
        // Get stack trace
        const stack = new Error().stack;
        
        // Log to console
        console.log(`%c🔍 DEBUG: fetch ${method} ${url}`, 'background: #ffeb3b; color: black;');
        console.log('Stack trace:', stack);
        
        // Store in history
        recentRequests.push({
          url,
          method,
          timestamp: Date.now(),
          stack
        });
        
        // Keep history limited
        if (recentRequests.length > MAX_REQUESTS) {
          recentRequests.shift();
        }
        
        // Update stats
        updateStats();
      }
      
      // Call the original fetch
      return originalFetch.apply(window, [input, init]);
    };

    // Process intervals to check for repeated requests
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const recentWindow = now - 5000; // Last 5 seconds
      
      const recentCount = recentRequests.filter(req => 
        req.timestamp > recentWindow && req.url.includes('/my-collection')
      ).length;
      
      if (recentCount >= 5) {
        // Excessive requests detected
        console.error(`❌ EXCESSIVE REQUESTS DETECTED: ${recentCount} requests to /my-collection in the last 5 seconds`);
        
        // Group by stack trace to find the source
        const stackCounts: Record<string, number> = {};
        recentRequests
          .filter(req => req.timestamp > recentWindow && req.url.includes('/my-collection'))
          .forEach(req => {
            const stackFirstLine = req.stack?.split('\n')[1]?.trim() || 'unknown';
            stackCounts[stackFirstLine] = (stackCounts[stackFirstLine] || 0) + 1;
          });
          
        console.error('Source breakdown:', Object.entries(stackCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([stack, count]) => `${count} requests from ${stack}`));
      }
    }, 5000);

    function updateStats() {
      const uniqueUrls = new Set(recentRequests.map(req => req.url)).size;
      const postRequests = recentRequests.filter(req => req.method === 'POST').length;
      
      setStats({
        totalRequests: recentRequests.length,
        uniqueUrls,
        postRequests
      });
    }

    // Clean up
    return () => {
      window.fetch = originalFetch;
      clearInterval(checkInterval);
    };
  }, [isActive]);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 bg-black/80 text-white p-2 text-xs z-50 rounded-tl-md">
      <button
        className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded mb-1 w-full"
        onClick={() => setIsActive(!isActive)}
      >
        {isActive ? 'Pause' : 'Resume'} Tracking
      </button>
      
      <div className="text-xs space-y-1">
        <div>Requests: {stats.totalRequests}</div>
        <div>Unique URLs: {stats.uniqueUrls}</div>
        <div>POST Requests: {stats.postRequests}</div>
      </div>
    </div>
  );
} 