import { Button } from "@/components/ui/button"
import { updateEbayPrices } from "@/actions/ebay-actions"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface Note {
  id: string;
  title: string;
  content: string;
  ebayListedValue?: number | null;
  ebaySoldValue?: number | null;
  condition: 'New' | 'Used';
  franchise: string;
}

interface NoteCardProps {
  note: Note;
  onUpdate: (updatedNote: Note) => void;
}

export function NoteCard({ note, onUpdate }: NoteCardProps) {
  const [refreshingType, setRefreshingType] = useState<'listed' | 'sold' | null>(null)
  const [loadingAiPrice, setLoadingAiPrice] = useState(false)

  const handleRefreshEbayPrices = async (type: 'listed' | 'sold') => {
    setRefreshingType(type)
    try {
      const result = await updateEbayPrices(note.id, note.title, type, note.condition, note.franchise)
      if (result.success && result.prices) {
        const updatedNote = {
          ...note,
          [type === 'listed' ? 'ebayListedValue' : 'ebaySoldValue']: result.prices.median
        };
        onUpdate(updatedNote);
      }
    } catch (error) {
      console.error(`Error refreshing eBay ${type} prices:`, error)
    } finally {
      setRefreshingType(null)
    }
  }

  const handleAiPriceRefresh = async (type: 'listed' | 'sold') => {
    if (note) {
      try {
        setLoadingAiPrice(true);
        
        // Import the action dynamically
        const { updateEbayPrices } = await import('@/actions/ebay-actions');
        const result = await updateEbayPrices(note.id, note.title, type, note.condition, note.franchise);
        
        if (result.success) {
          // Update local state with new value
          const updatedNote = {
            ...note,
            [type === 'listed' ? 'ebayListedValue' : 'ebaySoldValue']: result.prices?.median || null
          };
          onUpdate(updatedNote);
          
          // Show success notification
          toast({
            title: "AI Price updated",
            description: `Successfully updated AI price for ${note.title}.`,
          });
        } else {
          throw new Error(result.error || 'Failed to update AI price');
        }
      } catch (error) {
        console.error('Error updating AI price:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to update AI price',
          variant: "destructive",
        });
      } finally {
        setLoadingAiPrice(false);
      }
    }
  };

  return (
    <div>
      {/* ... existing note card content */}
      <div className="flex space-x-2">
        <Button 
          onClick={() => handleRefreshEbayPrices('listed')} 
          disabled={refreshingType !== null}
        >
          {refreshingType === 'listed' ? 'Refreshing...' : 'Refresh eBay Listed'}
        </Button>
        <Button 
          onClick={() => handleRefreshEbayPrices('sold')} 
          disabled={refreshingType !== null}
        >
          {refreshingType === 'sold' ? 'Refreshing...' : 'Refresh eBay Sold'}
        </Button>
      </div>
      <p>eBay Listed Value: {note.ebayListedValue ?? 'N/A'}</p>
      <p>eBay Sold Value: {note.ebaySoldValue ?? 'N/A'}</p>
    </div>
  )
}