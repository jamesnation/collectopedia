import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { updateAllEbayListedValues } from '@/actions/ebay-actions';

// We will use an API key for authentication to make sure
// only authorized cron jobs can trigger this endpoint.
const CRON_SECRET = process.env.CRON_SECRET;

// IMPORTANT: After confirming everything works, set this to false!
// This is just for initial setup and debugging
const ALLOW_UNAUTHENTICATED_FOR_TESTING = true; 

export async function GET(req: NextRequest) {
  console.log("Cron job API called with headers:", JSON.stringify(Object.fromEntries([...req.headers])));
  console.log("Query params:", req.nextUrl.searchParams.toString());
  
  // Bypass auth for initial testing when flag is enabled
  if (ALLOW_UNAUTHENTICATED_FOR_TESTING) {
    console.log("⚠️ RUNNING IN TEST MODE: Authentication bypassed");
  } else {
    // Check for Vercel cron job based on user-agent header
    const isVercelCron = req.headers.get('user-agent') === 'vercel-cron/1.0';
    const vercelProxySignature = req.headers.get('x-vercel-proxy-signature');
    
    console.log("Is Vercel cron job?", isVercelCron);
    console.log("Has Vercel proxy signature?", !!vercelProxySignature);
    
    // If not from Vercel cron or missing Vercel signature, check for our secret
    if (!isVercelCron || !vercelProxySignature) {
      // Check for authorization header
      const authHeader = req.headers.get('authorization');
      const cronSecretFromQuery = req.nextUrl.searchParams.get('cron_secret');
      
      console.log("Auth header exists?", !!authHeader);
      console.log("Query param exists?", !!cronSecretFromQuery);
      
      // Validate the secret (either from header or query param)
      if ((!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) && 
          (cronSecretFromQuery !== CRON_SECRET)) {
        console.log("Unauthorized cron job request - failed authentication check");
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      console.log("Authorized Vercel cron job request detected");
    }
  }

  try {
    // Get all users to process their collections
    const { data: users } = await clerkClient.users.getUserList();
    console.log(`Found ${users.length} users to process`);
    
    // Process users: update ebay listed values for each user
    const results = await updateAllEbayListedValues();
    
    return NextResponse.json({
      success: true,
      message: `Updated eBay listed values successfully.`,
      results
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: 'Failed to process cron job' }, { status: 500 });
  }
} 