import { readFileSync } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  try {
    // Get the path to the template.csv file in the public directory
    const filePath = path.join(process.cwd(), 'public', 'template.csv');
    
    // Read the file content
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Create the response with proper headers
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="collection-template.csv"',
      },
    });
  } catch (error) {
    console.error('Error serving template CSV:', error);
    return new NextResponse('Error serving template file', { status: 500 });
  }
} 