import { NextResponse } from 'next/server';

export async function GET() {
  // Create a CSV template with headers for all required fields
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
    'ebayListed',
    'ebaySold'
  ].join(',');
  
  // Add a sample row with example data
  const sampleRow = [
    'LEGO Star Wars X-Wing Fighter',
    'Construction Toy',
    'Star Wars',
    'LEGO',
    '2020',
    'New',
    '2023-01-15',
    '49.99',
    '60.00',
    'Gift from John',
    'false',
    '',
    '',
    '',
    ''
  ].join(',');
  
  // Combine headers and sample row
  const csvContent = `${csvHeaders}\n${sampleRow}`;
  
  // Return CSV as a downloadable file
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="collection-template.csv"'
    }
  });
} 