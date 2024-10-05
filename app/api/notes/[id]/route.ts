import { NextResponse } from 'next/server'
import { db } from '@/db/db'
import { itemsTable } from '@/db/schema/items-schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const json = await req.json()

    const updatedItem = await db
      .update(itemsTable)
      .set({
        // ... other fields
        ebayListed: json.ebayListedValue,
        ebaySold: json.ebaySoldValue,
      })
      .where(eq(itemsTable.id, id))
      .returning()

    return NextResponse.json(updatedItem[0])
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}