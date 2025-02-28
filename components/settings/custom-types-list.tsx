"use client"

import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CustomTypesList() {
  const [customTypes, setCustomTypes] = useState<string[]>([])
  const [newType, setNewType] = useState("")

  const handleAddType = () => {
    if (newType.trim() && !customTypes.includes(newType.trim())) {
      setCustomTypes([...customTypes, newType.trim()])
      setNewType("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="new-type" className="dark:text-foreground">Add Custom Type</Label>
          <div className="flex space-x-2">
            <Input
              id="new-type"
              placeholder="Enter custom type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="dark:bg-card dark:text-foreground dark:border-primary/20"
            />
            <Button 
              onClick={handleAddType}
              className="flex items-center gap-1 dark:bg-primary/70 dark:text-white dark:hover:bg-primary/60"
            >
              <PlusCircle className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-purple-400 dark:text-purple-400 mb-2">Custom Types</h3>
        {customTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            No custom types added yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {customTypes.map((type, index) => (
              <li 
                key={index}
                className="flex items-center justify-between p-2 rounded-md dark:bg-card/50 dark:text-foreground"
              >
                <span>{type}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomTypes(customTypes.filter((_, i) => i !== index))}
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