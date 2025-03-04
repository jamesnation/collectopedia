import { NextResponse } from 'next/server';
import { updateAllAIEstimates } from '@/actions/ai-estimate-actions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify the request is from a cron service
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const result = await updateAllAIEstimates();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: 'AI estimates updated successfully' });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 