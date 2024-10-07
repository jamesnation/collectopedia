"use client";

import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Package, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-[#FDF7F5] shadow-md">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {/* Move burger menu button to the left */}
          <button
            className="md:hidden text-purple-700 hover:text-purple-500 mr-2"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <Package className="h-8 w-8 text-purple-700" />
          <span className="text-2xl font-bold text-purple-700">Collectopedia</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-purple-700 hover:text-purple-500">Home</Link>
          <Link href="/catalog" className="text-purple-700 hover:text-purple-500">Catalog</Link>
        </nav>
        <div className="flex items-center space-x-2">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="border-purple-700 text-purple-700 hover:bg-purple-100">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <span className="text-sm text-gray-600 mr-2 hidden md:inline">Welcome, Collector</span>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isMenuOpen && (
        <nav className="md:hidden bg-[#FDF7F5] p-4">
          <div className="space-y-2">
            <Link href="/" className="block text-purple-700 hover:text-purple-500" onClick={toggleMenu}>
              Home
            </Link>
            <Link href="/catalog" className="block text-purple-700 hover:text-purple-500" onClick={toggleMenu}>
              Catalog
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
