import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getItemsByUserIdAction } from '@/actions/items-actions';
import { mapSchemaItemToCatalogItem } from '@/components/catalog/utils/schema-adapter';

export async function GET(request: NextRequest) {
  // Get the user ID from auth
  const { userId } = auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    // Fetch all items for the user
    const result = await getItemsByUserIdAction(userId);
    
    if (!result.isSuccess || !result.data) {
      throw new Error(result.error || 'Failed to fetch items');
    }
    
    // Map the database items to catalog items
    const items = result.data.map(mapSchemaItemToCatalogItem);
    
    // Define the CSV headers
    const csvHeaders = [
      'name',
      'type',
      'franchise',
      'brand',
      'year',
      'condition',
      'acquired',
      'cost',
      'value',
      'notes',
      'isSold',
      'soldDate',
      'soldPrice',
      'aiEstimate' // Adding the AI estimate column
    ].join(',');
    
    // Convert items to CSV rows
    const csvRows = items.map(item => {
      return [
        // Wrap values in quotes and escape any internal quotes
        `"${item.name?.replace(/"/g, '""') || ''}"`,
        `"${item.type?.replace(/"/g, '""') || ''}"`,
        `"${item.franchise?.replace(/"/g, '""') || ''}"`,
        `"${item.brand?.replace(/"/g, '""') || ''}"`,
        item.year || '',
        `"${item.condition || ''}"`,
        item.acquired ? new Date(item.acquired).toISOString().split('T')[0] : '',
        item.cost || 0,
        item.value || 0,
        `"${item.notes?.replace(/"/g, '""') || ''}"`,
        item.isSold ? 'true' : 'false',
        item.soldDate ? new Date(item.soldDate).toISOString().split('T')[0] : '',
        item.soldPrice || '',
        item.ebayListed || '' // Using ebayListed as the AI estimate
      ].join(',');
    });
    
    // Combine headers and rows into CSV content
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Return CSV as a downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="collection-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting items:', error);
    return new NextResponse(
      `Error exporting items: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
} 