import { updateAllAIEstimates } from '@/actions/ai-estimate-actions';

async function main() {
  console.log('Starting AI estimate update for all items...');
  
  try {
    const result = await updateAllAIEstimates();
    
    if (result.success) {
      console.log('Successfully updated AI estimates for all items');
    } else {
      console.error('Failed to update AI estimates:', result.error);
    }
  } catch (error) {
    console.error('Error running AI estimate update:', error);
  }
}

main(); 