"use client"

import { Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function PreferencesTab() {
  return (
    <div className="space-y-6">
      <Card className="border shadow-sm dark:bg-card/60 dark:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Settings className="h-5 w-5 text-purple-400" />
            Display Preferences
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Customize how your collection is displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Display preferences will be added in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 