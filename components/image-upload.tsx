'use client'

import React, { useState, useEffect } from 'react'
import { useSupabase } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
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

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i]
        const fileSize = file.size / 1024 / 1024 // size in MB

        if (fileSize > 6) {
          throw new Error(`File "${file.name}" exceeds 6MB limit. Please choose a smaller file.`)
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}_${Date.now()}_${i}.${fileExt}`

        console.log('Uploading file:', fileName, 'Size:', fileSize.toFixed(2), 'MB')

        if (!token) {
          throw new Error('Authentication token not available')
        }

        const { error: uploadError, data } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        console.log('Upload successful:', data)

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName)

        console.log('Public URL:', publicUrl)

        onUpload(publicUrl)
      }

      toast({
        title: "Images uploaded successfully",
        description: "Your images have been uploaded and attached to the item.",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      toast({
        title: "Error uploading image",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <Label htmlFor="image" className="text-sm font-medium text-purple-700">Item Images (Max 6MB each)</Label>
      <div className="mt-1 flex items-center space-x-2">
        <Button
          type="button"
          onClick={() => document.getElementById('image')?.click()}
          className="bg-purple-100 text-purple-700 hover:bg-purple-200"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Choose Files'
          )}
        </Button>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={uploadImage}
          className="hidden"
          multiple // Add this to allow multiple file selection
        />
      </div>
    </div>
  )
}