"use client"

import React from 'react';
import { Inter } from "next/font/google";
import { ClerkProvider, SignedIn, SignedOut, SignOutButton } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { RegionProvider } from "@/contexts/region-context";
import Link from 'next/link';
import { Package, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`h-screen flex flex-col ${inter.className}`}>
      <MarketingNavbar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// Marketing Navbar Component
function MarketingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Package className="h-6 w-6 text-purple-400" />
              <span className="text-lg font-bold ml-3 bg-gradient-to-r from-purple-500 to-pink-500 inline-block text-transparent bg-clip-text">Collectopedia</span>
            </Link>
          </div>
          
          {/* Desktop Navigation Links (Centered) */}
          <nav className="hidden md:flex flex-1 justify-center items-center space-x-6">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              FAQ
            </button>
          </nav>

          {/* Desktop Auth Buttons & Mobile Menu Toggle */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-3">
              <SignedIn>
                <div className="flex items-center space-x-3">
                  <Link href="/my-collection">
                    <Button variant="default" className="bg-purple-600 text-white hover:bg-purple-700">
                      My Collection
                    </Button>
                  </Link>
                  <SignOutButton redirectUrl="/">
                    <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-800">
                      Sign Out
                    </Button>
                  </SignOutButton>
                </div>
              </SignedIn>
              
              <SignedOut>
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-800">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="default" className="bg-purple-600 text-white hover:bg-purple-700">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </SignedOut>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-300 rounded-md hover:bg-gray-800"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobile && (
        <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-gray-900 border-b border-gray-800`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
            >
              FAQ
            </button>
            
            <SignedIn>
              <div className="space-y-2 px-3 py-2 border-t border-gray-800 mt-2">
                <Link 
                  href="/my-collection"
                  className="block px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  My Collection
                </Link>
                <SignOutButton redirectUrl="/">
                  <Button variant="outline" className="w-full text-white border-gray-600 hover:bg-gray-800">
                    Sign Out
                  </Button>
                </SignOutButton>
              </div>
            </SignedIn>
            
            <SignedOut>
              <div className="space-y-2 px-3 py-2">
                <Link 
                  href="/login"
                  className="block w-full" 
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="outline" className="w-full text-white border-gray-600 hover:bg-gray-800">
                    Login
                  </Button>
                </Link>
                <Link 
                  href="/signup"
                  className="block w-full" 
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="default" className="w-full bg-purple-600 text-white hover:bg-purple-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
} 