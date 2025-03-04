import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { updateAllEbayListedValues } from '@/actions/ebay-actions';

// We will use an API key for authentication to make sure
// only authorized cron jobs can trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // For Vercel Cron Jobs, we'll add a special bypass when running from Vercel's cron system
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  
  // If not from Vercel cron, check for our secret
  if (!isVercelCron) {
    // Check for secret in header or query param
    const authHeader = req.headers.get('authorization');
    const secretParam = req.nextUrl.searchParams.get('cron_secret');
    
    const isAuthorized = 
      (authHeader === `Bearer ${CRON_SECRET}`) || 
      (secretParam === CRON_SECRET);
    
    if (!CRON_SECRET || !isAuthorized) {
      console.error('Unauthorized cron job request. Not from Vercel and no valid auth.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.log('Request from Vercel Cron system detected, bypassing auth check');
  }

  try {
    // Get all users from Clerk
    const { data: users } = await clerkClient.users.getUserList();

    console.log(`Found ${users.length} users to process`);
    
    // Process each user
    const results = [];
    
    for (const user of users) {
      try {
        // Set the user context for the server action
        const result = await updateAllEbayListedValues();
        results.push({ userId: user.id, result });
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.push({ userId: user.id, error: 'Failed to update values' });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${users.length} users`,
      results
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
} 