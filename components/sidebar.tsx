"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Package, Menu, X, LogIn, Settings } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { UserButton, SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from '@/hooks/use-media-query'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      <nav className="space-y-1 flex-grow">
        <Link href="/my-collection" prefetch={true} onClick={closeMobileSidebar} className="flex items-center space-x-2 p-2 rounded hover:bg-muted w-full text-left text-foreground hover:text-purple-400 transition-colors">
          <Package className="h-4 w-4" />
          <span>My Collection</span>
        </Link>
        <Link href="/settings" prefetch={true} onClick={closeMobileSidebar} className="flex items-center space-x-2 p-2 rounded hover:bg-muted w-full text-left text-foreground hover:text-purple-400 transition-colors">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </nav>
      
      <div className="mt-auto space-y-2">
        <Separator className="my-2 bg-border" />
        <SignedIn>
          <div className="flex items-center space-x-2 p-2">
            <UserButton afterSignOutUrl="/" />
            {user && user.emailAddresses && (
              <span className="text-xs text-muted-foreground truncate">
                {user.emailAddresses[0].emailAddress}
              </span>
            )}
          </div>
        </SignedIn>
        <SignedOut>
          <div className="space-y-2">
            <SignInButton mode="modal">
              <Button 
                variant="outline" 
                className="w-full border-primary/70 text-purple-400 hover:bg-muted hover:text-primary/50"
              >
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Button>
            </SignInButton>
            {isMobile && (
              <Link href="/signup" prefetch={true} className="block md:hidden" onClick={closeMobileSidebar}>
                <Button
                  variant="default"
                  className="w-full bg-primary/70 text-primary-foreground hover:bg-primary/50"
                >
                  Sign Up
                </Button>
              </Link>
            )}
          </div>
        </SignedOut>
      </div>
    </>
  )

  return (
    <>
      {isMobile ? (
        <>
          {/* Mobile Header */}
          <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card shadow-sm border-b border-border flex items-center justify-between px-4">
            <Link href="/" prefetch={true} className="flex items-center" onClick={closeMobileSidebar}>
              <Package className="h-6 w-6 text-purple-400" />
              <span className="text-lg font-bold ml-3 bg-gradient-to-r from-purple-500 to-pink-500 inline-block text-transparent bg-clip-text">Collectopedia</span>
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-2 text-foreground rounded-md hover:bg-muted"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </header>

          {/* Mobile Sidebar */}
          <aside 
            className={`
              fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out transform
              ${isOpen ? 'translate-x-0' : '-translate-x-full'}
              w-64 bg-card text-foreground p-4 flex flex-col h-screen text-sm border-r border-border
            `}
          >
            <div className="mt-16">
              <SidebarContent />
            </div>
          </aside>
        </>
      ) : (
        // Desktop Sidebar
        <aside className="hidden md:flex flex-col w-64 bg-card text-foreground p-4 h-screen text-sm border-r border-border">
          <Link href="/" prefetch={true} className="flex items-center mb-8">
            <Package className="h-6 w-6 text-purple-400" />
            <span className="text-lg font-bold ml-3 bg-gradient-to-r from-purple-500 to-pink-500 inline-block text-transparent bg-clip-text">Collectopedia</span>
          </Link>
          <SidebarContent />
        </aside>
      )}
    </>
  )
}
