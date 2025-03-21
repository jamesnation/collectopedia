import { NextResponse } from 'next/server';
import { updateAllItemsImagesTimestampAction } from '@/actions/items-actions';

// Helper for conditional logging
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

// This endpoint updates the imagesUpdatedAt field for all items that don't have it set
export async function GET() {
  try {
    const result = await updateAllItemsImagesTimestampAction();
    
    if (result.isSuccess) {
      // Only log meaningful updates
      if (result.data && result.data > 0) {
        console.log(`API: Updated ${result.data} items with image timestamps`);
      } else {
        debugLog('API: No items needed timestamp updates');
      }
      
      return NextResponse.json({
        success: true,
        message: `Updated ${result.data} items with image timestamps`,
        updatedCount: result.data
      });
    } else {
      console.error('API error:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error running image timestamp update:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 