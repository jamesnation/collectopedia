"use client"

import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CSVImport } from "@/components/settings/csv-import"
import { DeleteUserData } from "@/components/settings/delete-user-data"
import { itemTypeEnum, franchiseEnum } from "@/db/schema/items-schema"

// Define default brands (assuming this is what was in constants)
const DEFAULT_BRANDS = [
  "Funko",
  "LEGO",
  "Hasbro",
  "Mattel",
  "Bandai",
  "Hot Toys",
  "McFarlane Toys",
  "Mezco",
  "NECA",
  "Good Smile Company",
  "Sideshow Collectibles"
]

export function CollectionsTab() {
  const handleAddItem = async () => {
    console.log("Adding item from CSV")
    return true
  }

  const handleCreateCustomType = async () => {
    console.log("Creating custom type from CSV")
    return true
  }

  const handleCreateCustomFranchise = async () => {
    console.log("Creating custom franchise from CSV")
    return true
  }

  const handleCreateCustomBrand = async () => {
    console.log("Creating custom brand from CSV")
    return true
  }

  const loadCustomTypes = async () => {
    console.log("Loading custom types")
    return []
  }

  const loadCustomFranchises = async () => {
    console.log("Loading custom franchises")
    return []
  }

  const loadCustomBrands = async () => {
    console.log("Loading custom brands")
    return []
  }

  return (
    <div className="space-y-6">
      <CSVImport
        onAddItem={handleAddItem}
        onCreateCustomType={handleCreateCustomType}
        onCreateCustomFranchise={handleCreateCustomFranchise}
        onCreateCustomBrand={handleCreateCustomBrand}
        onLoadCustomTypes={loadCustomTypes}
        onLoadCustomFranchises={loadCustomFranchises}
        onLoadCustomBrands={loadCustomBrands}
        defaultTypeOptions={itemTypeEnum.enumValues}
        defaultFranchiseOptions={franchiseEnum.enumValues}
        defaultBrandOptions={DEFAULT_BRANDS}
      />
      
      <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Actions that will permanently affect your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteUserData />
        </CardContent>
      </Card>
    </div>
  )
} 