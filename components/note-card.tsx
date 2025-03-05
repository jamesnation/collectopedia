import { Button } from "@/components/ui/button"
import { updateEbayPrices } from "@/actions/ebay-actions"
import { useState } from "react"

interface Note {
  id: string;
  title: string;
  content: string;
  ebayListedValue?: number | null;
  ebaySoldValue?: number | null;
}

interface NoteCardProps {
  note: Note;
  onUpdate: (updatedNote: Note) => void;
}

export function NoteCard({ note, onUpdate }: NoteCardProps) {
  const [refreshingType, setRefreshingType] = useState<'listed' | 'sold' | null>(null)

  const handleRefreshEbayPrices = async (type: 'listed' | 'sold') => {
    setRefreshingType(type)
    try {
      const result = await updateEbayPrices(note.id, note.title, type)
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