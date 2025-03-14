"use client";

/**
 * components/item-details/item-tabs/history-tab.tsx
 * 
 * This component displays the history of changes made to an item.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpDown, CalendarIcon, Clock, Edit } from "lucide-react";

interface HistoryEvent {
  id: string;
  type: 'created' | 'updated' | 'priceChange' | 'sold' | 'purchased' | 'statusChange';
  timestamp: string;
  details: {
    field?: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    price?: number;
    note?: string;
  };
}

interface HistoryTabProps {
  events: HistoryEvent[];
  isLoading?: boolean;
}

export function HistoryTab({ events, isLoading = false }: HistoryTabProps) {
  
  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'created':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Added</Badge>;
      case 'updated':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Updated</Badge>;
      case 'priceChange':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Price</Badge>;
      case 'sold':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Sold</Badge>;
      case 'purchased':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Purchased</Badge>;
      case 'statusChange':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Status</Badge>;
      default:
        return <Badge variant="outline">Event</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const renderEventDetails = (event: HistoryEvent) => {
    switch (event.type) {
      case 'created':
        return <p className="text-sm text-muted-foreground">Item was added to your collection</p>;
      case 'updated':
        return (
          <p className="text-sm text-muted-foreground">
            {event.details.field} changed from &quot;{event.details.oldValue}&quot; to &quot;{event.details.newValue}&quot;
          </p>
        );
      case 'priceChange':
        return (
          <p className="text-sm text-muted-foreground">
            Market value {event.details.oldValue && event.details.newValue && 
              Number(event.details.newValue) > Number(event.details.oldValue) 
                ? "increased" 
                : "decreased"} from ${event.details.oldValue || 0} to ${event.details.newValue || 0}
            {event.details.note && <span className="block italic text-xs">{event.details.note}</span>}
          </p>
        );
      case 'sold':
        return <p className="text-sm text-muted-foreground">Item sold for ${event.details.price}</p>;
      case 'purchased':
        return <p className="text-sm text-muted-foreground">Item purchased for ${event.details.price}</p>;
      case 'statusChange':
        return (
          <p className="text-sm text-muted-foreground">
            Status changed from &quot;{event.details.oldValue}&quot; to &quot;{event.details.newValue}&quot;
          </p>
        );
      default:
        return <p className="text-sm text-muted-foreground">Event occurred</p>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin mr-2">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CalendarIcon className="h-8 w-8 mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No history events available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border">
          <div className="p-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-start pb-4 last:pb-0 mb-4 last:mb-0 border-b last:border-0">
                <div className="mr-2 bg-secondary h-8 w-8 rounded-full flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</h4>
                    <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                  </div>
                  {renderEventDetails(event)}
                  {event.details.note && (
                    <p className="text-xs italic mt-1 text-muted-foreground">&quot;{event.details.note}&quot;</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 