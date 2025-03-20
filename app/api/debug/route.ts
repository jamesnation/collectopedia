/**
 * Debug API route
 * Only meant for development testing
 */

import { NextResponse } from 'next/server';
import { addMinimalItem } from '@/actions/catalog-actions';

export async function GET(request: Request) {
  try {
    console.log('[DEBUG-API] Received debug request');
    const testName = `Test Item ${new Date().toISOString()}`;
    
    console.log(`[DEBUG-API] Creating minimal test item: "${testName}"`);
    const result = await addMinimalItem(testName);
    
    console.log(`[DEBUG-API] Item created successfully:`, result);
    return NextResponse.json({ 
      success: true, 
      message: 'Debug item created',
      item: result
    });
  } catch (error) {
    console.error('[DEBUG-API] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 