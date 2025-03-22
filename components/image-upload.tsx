'use client'

import React, { useState, useEffect } from 'react'
import { useSupabase } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@clerk/nextjs"

interface ImageUploadProps {
  onUpload: (url: string) => void
  bucketName: string
}

export default function ImageUpload({ onUpload, bucketName }: ImageUploadProps) {
  const { supabase } = useSupabase()
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const { userId, getToken } = useAuth()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const fetchToken = async () => {
      const fetchedToken = await getToken({ template: "supabase" })
      setToken(fetchedToken)
    }
    fetchToken()
  }, [getToken])

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      console.log('[DEBUG] Image upload started')

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      console.log('[DEBUG] Files selected:', event.target.files.length)

      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i]
        const fileSize = file.size / 1024 / 1024 // size in MB

        if (fileSize > 6) {
          throw new Error(`File "${file.name}" exceeds 6MB limit. Please choose a smaller file.`)
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}_${Date.now()}_${i}.${fileExt}`

        console.log('[DEBUG] Uploading file:', fileName, 'Size:', fileSize.toFixed(2), 'MB', 'User ID:', userId)

        if (!token) {
          console.error('[DEBUG] Authentication token not available')
          throw new Error('Authentication token not available')
        }

        console.log('[DEBUG] Starting Supabase upload to bucket:', bucketName)
        
        const { error: uploadError, data } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })

        if (uploadError) {
          console.error('[DEBUG] Upload error:', uploadError)
          throw uploadError
        }

        console.log('[DEBUG] Upload successful:', data)

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName)

        console.log('[DEBUG] Public URL generated:', publicUrl)

        // Directly call onUpload with the URL
        onUpload(publicUrl)
        console.log('[DEBUG] Called onUpload with URL:', publicUrl)
      }

      toast({
        title: "Images uploaded successfully",
        description: "Your images have been uploaded and attached to the item.",
      })
    } catch (error) {
      console.error('[DEBUG] Error uploading image:', error)
      if (error instanceof Error) {
        console.error('[DEBUG] Error message:', error.message)
        console.error('[DEBUG] Error stack:', error.stack)
      }
      toast({
        title: "Error uploading image",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      console.log('[DEBUG] Upload process completed')
      // Clear the file input
      const fileInput = document.getElementById('image') as HTMLInputElement
      if (fileInput) fileInput.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start">
        <ImageIcon className="w-4 h-4 mr-2 mt-0.5 text-primary" />
        <div>
          <Label htmlFor="image" className="font-medium text-foreground">Upload Images</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add high-quality photos of your item (max 6MB each)
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <Button
          type="button"
          onClick={() => document.getElementById('image')?.click()}
          className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary flex items-center justify-center"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              <span>Select Images</span>
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          {uploading ? "Please wait while your images upload..." : "JPG, PNG or GIF files accepted"}
        </p>
        
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={uploadImage}
          className="hidden"
          multiple
        />
      </div>
    </div>
  )
}