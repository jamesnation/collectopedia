import { db } from "../db";
import { imagesTable } from "../schema/images-schema";
import { eq, sql } from "drizzle-orm";

export async function migrateImageOrder() {
  try {
    console.log('Starting image order migration...');
    
    // Get all distinct item IDs that have images
    const result = await db.execute(
      sql`SELECT DISTINCT item_id FROM images`
    );
    
    // Extract item_id values from the result
    const itemIds: string[] = [];
    for (const row of result) {
      if (row && typeof row === 'object' && 'item_id' in row) {
        itemIds.push(row.item_id as string);
      }
    }
    
    console.log(`Found ${itemIds.length} items with images to migrate`);
    
    // For each item, get its images and update their order
    for (const itemId of itemIds) {
      // Get images in their current order (likely by created_at)
      const images = await db.select().from(imagesTable).where(eq(imagesTable.itemId, itemId));
      
      // Update each image with its index as the order
      for (let i = 0; i < images.length; i++) {
        await db.update(imagesTable)
          .set({ order: i })
          .where(eq(imagesTable.id, images[i].id));
      }
      
      console.log(`Updated order for ${images.length} images of item ${itemId}`);
    }
    
    console.log('Image order migration completed successfully');
    return true;
  } catch (error) {
    console.error('Image order migration failed:', error);
    return false;
  }
}

// Run migration if file is executed directly
if (require.main === module) {
  migrateImageOrder()
    .then(success => {
      if (success) {
        console.log('Migration completed successfully');
        process.exit(0);
      } else {
        console.error('Migration failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error during migration:', error);
      process.exit(1);
    });
} 