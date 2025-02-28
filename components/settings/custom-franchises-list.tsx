"use client"

import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CustomFranchisesList() {
  const [customFranchises, setCustomFranchises] = useState<string[]>([])
  const [newFranchise, setNewFranchise] = useState("")

  const handleAddFranchise = () => {
    if (newFranchise.trim() && !customFranchises.includes(newFranchise.trim())) {
      setCustomFranchises([...customFranchises, newFranchise.trim()])
      setNewFranchise("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="new-franchise" className="dark:text-foreground">Add Custom Franchise</Label>
          <div className="flex space-x-2">
            <Input
              id="new-franchise"
              placeholder="Enter custom franchise"
              value={newFranchise}
              onChange={(e) => setNewFranchise(e.target.value)}
              className="dark:bg-card dark:text-foreground dark:border-border"
            />
            <Button 
              onClick={handleAddFranchise}
              className="flex items-center gap-1 dark:bg-primary/70 dark:text-white dark:hover:bg-primary/60"
            >
              <PlusCircle className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-purple-400 dark:text-purple-400 mb-2">Custom Franchises</h3>
        {customFranchises.length === 0 ? (
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            No custom franchises added yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {customFranchises.map((franchise, index) => (
              <li 
                key={index}
                className="flex items-center justify-between p-2 rounded-md dark:bg-card/50 dark:text-foreground"
              >
                <span>{franchise}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomFranchises(customFranchises.filter((_, i) => i !== index))}
                  className="h-8 px-2 dark:text-muted-foreground dark:hover:text-foreground"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
} 