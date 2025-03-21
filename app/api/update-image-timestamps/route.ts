import { NextResponse } from 'next/server';
import { updateAllItemsImagesTimestampAction } from '@/actions/items-actions';

// This endpoint updates the imagesUpdatedAt field for all items that don't have it set
export async function GET() {
  try {
    const result = await updateAllItemsImagesTimestampAction();
    
    if (result.isSuccess) {
      return NextResponse.json({
        success: true,
        message: `Updated ${result.data} items with image timestamps`,
        updatedCount: result.data
      });
    } else {
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