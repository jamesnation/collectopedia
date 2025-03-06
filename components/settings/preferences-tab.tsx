"use client"

import { BugIcon, ImageIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useEbayDebugMode } from "@/hooks/use-ebay-debug-mode"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"

export function PreferencesTab() {
  const { isDebugMode, isInitialized, toggleDebugMode } = useEbayDebugMode();

  useEffect(() => {
    console.log('PreferencesTab - Debug mode status:', { isDebugMode, isInitialized });
  }, [isDebugMode, isInitialized]);

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <BugIcon className="h-5 w-5 text-purple-400" />
            Developer Options
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Advanced features for debugging and development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ebay-debug-mode" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                eBay Image Search Debug
              </Label>
              <p className="text-sm text-muted-foreground">
                Show matched eBay images when using AI price estimation
              </p>
            </div>
            <Switch
              id="ebay-debug-mode"
              checked={isDebugMode}
              onCheckedChange={toggleDebugMode}
              disabled={!isInitialized}
            />
          </div>
          
          <Separator className="my-4" />
          
          <p className="text-xs text-muted-foreground italic">
            These options are intended for development and debugging purposes only.
            Enabling them may affect application performance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 