"use client"

import React from 'react'
import Link from 'next/link'
import { Package, BarChart4, Info, Settings } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { UserButton, SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  const { user } = useUser();

  return (
    <aside className="w-52 bg-purple-900 text-white p-4 flex flex-col h-screen text-sm">
      <Link href="/" className="flex items-center mb-6">
        <Package className="h-6 w-6 mr-2" />
        <span className="text-lg font-bold">Collectopedia</span>
      </Link>
      
      <nav className="space-y-1 flex-grow">
        <Link href="/catalog" className="flex items-center space-x-2 p-2 rounded hover:bg-purple-800">
          <Package className="h-4 w-4" />
          <span>Catalog</span>
        </Link>
        <Link href="/stats" className="flex items-center space-x-2 p-2 rounded hover:bg-purple-800">
          <BarChart4 className="h-4 w-4" />
          <span>Stats</span>
        </Link>
        <Link href="/about" className="flex items-center space-x-2 p-2 rounded hover:bg-purple-800">
          <Info className="h-4 w-4" />
          <span>About</span>
        </Link>
      </nav>
      
      <div className="mt-auto space-y-2">
        <Link href="/settings" className="flex items-center space-x-2 p-2 rounded hover:bg-purple-800">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <Separator className="my-2 bg-purple-700 opacity-50" />
        <SignedIn>
          <div className="flex items-center space-x-2 p-2">
            <UserButton afterSignOutUrl="/" />
            {user && user.emailAddresses && (
              <span className="text-xs text-white truncate">
                {user.emailAddresses[0].emailAddress}
              </span>
            )}
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button 
              variant="outline" 
              className="w-full bg-purple-800 text-white border-purple-600 hover:bg-purple-700 hover:text-white"
            >
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    </aside>
  )
}
