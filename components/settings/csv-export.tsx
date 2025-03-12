"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Download, Loader2, FileDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@clerk/nextjs'

export function CSVExport() {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { userId } = useAuth()

  const handleExport = async () => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to export your collection",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    
    try {
      // Create a link to our export API endpoint
      const exportUrl = '/api/export'
      const link = document.createElement('a')
      link.href = exportUrl
      link.setAttribute('download', `collection-export-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export Started",
        description: "Your collection data is being exported. The download should begin shortly.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Error",
        description: error instanceof Error ? error.message : "An error occurred during export",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-foreground">
          <FileDown className="h-5 w-5 text-purple-400" />
          Export Collection Data
        </CardTitle>
        <CardDescription className="dark:text-muted-foreground">
          Export your collection data to a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Export all your collection data to a CSV file. The file will include all item details including the AI estimate values.
          </p>
          <div className="flex justify-start">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 flex items-center gap-2 dark:bg-primary/70 dark:text-white dark:hover:bg-primary/60"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Collection as CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 