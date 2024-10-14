"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Package, BarChart4, Info, Settings, Menu, X, LogIn } from 'lucide-react'
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
        <button onClick={() => handleNavClick('/catalog')} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 w-full text-left text-gray-300 hover:text-white transition-colors">
          <Package className="h-4 w-4" />
          <span>Catalog</span>
        </button>
        <button onClick={() => handleNavClick('/stats')} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 w-full text-left text-gray-300 hover:text-white transition-colors">
          <BarChart4 className="h-4 w-4" />
          <span>Stats</span>
        </button>
        <button onClick={() => handleNavClick('/about')} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 w-full text-left text-gray-300 hover:text-white transition-colors">
          <Info className="h-4 w-4" />
          <span>About</span>
        </button>
      </nav>
      
      <div className="mt-auto space-y-2">
        <button onClick={() => handleNavClick('/settings')} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 w-full text-left text-gray-300 hover:text-white transition-colors">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
        <Separator className="my-2 bg-gray-700" />
        <SignedIn>
          <div className="flex items-center space-x-2 p-2">
            <UserButton afterSignOutUrl="/" />
            {user && user.emailAddresses && (
              <span className="text-xs text-gray-400 truncate">
                {user.emailAddresses[0].emailAddress}
              </span>
            )}
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button 
              variant="outline" 
              className="w-full border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-gray-900"
            >
              <LogIn className="mr-2 h-4 w-4" /> Sign In
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
            className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Centered Logo (always visible on mobile) */}
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center h-16 bg-gray-900 shadow-sm">
            <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
              <Package className="h-6 w-6 text-purple-400" />
              <span className="text-lg font-bold text-purple-400 ml-2">Collectopedia</span>
            </Link>
          </div>

          {/* Mobile Sidebar (slides in from left) */}
          <aside 
            className={`
              fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out transform
              ${isOpen ? 'translate-x-0' : '-translate-x-full'}
              w-64 bg-gray-800 text-white p-4 flex flex-col h-screen text-sm
            `}
          >
            <div className="mt-16">
              <SidebarContent />
            </div>
          </aside>
        </>
      ) : (
        // Desktop Sidebar
        <aside className="relative w-64 bg-gray-800 text-white p-6 flex flex-col h-screen text-sm">
          <Link href="/" className="flex items-center mb-10">
            <Package className="h-6 w-6 text-purple-400 mr-2" />
            <span className="text-xl font-semibold text-purple-400">Collectopedia</span>
          </Link>
          
          <SidebarContent />
        </aside>
      )}
    </>
  )
}