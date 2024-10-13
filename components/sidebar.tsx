"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Package, BarChart4, Info, Settings, Menu, X } from 'lucide-react'
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

  const handleNavClick = (href: string) => {
    router.push(href);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      <nav className="space-y-1 flex-grow">
        <button onClick={() => handleNavClick('/catalog')} className="flex items-center space-x-2 p-2 rounded hover:bg-purple-800 w-full text-left">
          <Package className="h-4 w-4" />
          <span>Catalog</span>
        </button>
        <button onClick={() => handleNavClick('/stats')} className="flex items-center space-x-2 p-2 rounded hover:bg-purple-800 w-full text-left">
          <BarChart4 className="h-4 w-4" />
          <span>Stats</span>
        </button>
        <button onClick={() => handleNavClick('/about')} className="flex items-center space-x-2 p-2 rounded hover:bg-purple-800 w-full text-left">
          <Info className="h-4 w-4" />
          <span>About</span>
        </button>
      </nav>
      
      <div className="mt-auto space-y-2">
        <button onClick={() => handleNavClick('/settings')} className="flex items-center space-x-2 p-2 rounded hover:bg-purple-800 w-full text-left">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
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
    </>
  )

  return (
    <>
      {isMobile ? (
        <>
          {/* Mobile Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-2 bg-purple-900 text-white rounded-md"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Centered Logo (always visible on mobile) */}
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center h-16 bg-white shadow-sm">
            <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
              <Package className="h-6 w-6 text-purple-900" />
              <span className="text-lg font-bold text-purple-900 ml-2">Collectopedia</span>
            </Link>
          </div>

          {/* Mobile Sidebar (slides in from left) */}
          <aside 
            className={`
              fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out transform
              ${isOpen ? 'translate-x-0' : '-translate-x-full'}
              w-52 bg-purple-900 text-white p-4 flex flex-col h-screen text-sm
            `}
          >
            <div className="mt-16">
              <SidebarContent />
            </div>
          </aside>
        </>
      ) : (
        // Desktop Sidebar
        <aside className="relative w-52 bg-purple-900 text-white p-4 flex flex-col h-screen text-sm">
          <Link href="/" className="flex items-center mb-6">
            <Package className="h-6 w-6 mr-2" />
            <span className="text-lg font-bold">Collectopedia</span>
          </Link>
          
          <SidebarContent />
        </aside>
      )}
    </>
  )
}
