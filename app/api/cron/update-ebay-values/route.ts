import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { updateAllEbayListedValues } from '@/actions/ebay-actions';

// We will use an API key for authentication to make sure
// only authorized cron jobs can trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify the request is from our cron job service
  const authHeader = req.headers.get('authorization');
  const secretParam = req.nextUrl.searchParams.get('cron_secret');
  
  // Check if either the header or query param matches
  const isAuthorized = 
    (authHeader === `Bearer ${CRON_SECRET}`) || 
    (secretParam === CRON_SECRET);
  
  if (!CRON_SECRET || !isAuthorized) {
    console.error('Unauthorized cron job request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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