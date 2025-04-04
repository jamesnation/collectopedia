"use client";

// Updated 04/04/2024: Show sidebar on /my-collection and /settings pages

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar"; // Assuming this path is correct

interface AppLayoutProps {
  userId: string | null; // Pass the userId to know if logged in
  children: React.ReactNode; // To render the page content
}

export default function AppLayout({ userId, children }: AppLayoutProps) {
  const pathname = usePathname();

  // Determine if the sidebar should be shown
  // Show only if logged in (userId exists) AND on specific pages
  const showSidebar = userId && (pathname === "/my-collection" || pathname === "/settings");

  return (
    // This div structure is moved from app/layout.tsx
    <div className="flex h-screen dark:bg-black/30">
      {/* Conditionally render the Sidebar */}
      {showSidebar && <Sidebar />}

      {/* 
         The main content area. 
         - flex-1 makes it take up remaining space.
         - overflow-auto allows scrolling within the main area if content overflows.
         - We might need to adjust padding based on whether the sidebar is shown. 
           For now, let's keep the original top padding logic based on userId. 
           We can refine padding later if needed (e.g., adding left padding if showSidebar is true).
      */}
      <main className={`flex-1 overflow-auto ${userId ? "pt-16 md:pt-0" : ""}`}>
        {children}
      </main>
    </div>
  );
} 