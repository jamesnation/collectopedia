import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { RegionProvider } from "@/contexts/region-context";
import Sidebar from "@/components/sidebar";
import { auth } from "@clerk/nextjs/server";
import { getProfileByUserIdAction } from "@/actions/profiles-actions";
import { createProfile } from "@/db/queries/profiles-queries";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collectopedia",
  description: "Manage your collection with ease",
};

// This function is optimized to check for profiles only once per session
async function ensureUserProfile(userId: string) {
  const profileChecked = cookies().get('profile-checked');
  
  if (!profileChecked) {
    const res = await getProfileByUserIdAction(userId);
    
    if (!res.data) {
      await createProfile({ userId });
    }
    
    // Set a cookie to avoid checking on every page load
    cookies().set('profile-checked', 'true', { 
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/' 
    });
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  
  if (userId) {
    try {
      await ensureUserProfile(userId);
    } catch (error) {
      // Silent fail, will retry on next page load
    }
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://sjjbgnzyywlgpmgtmube.supabase.co" />
          <link rel="preconnect" href="https://vercel.com" />
          <link rel="dns-prefetch" href="https://sjjbgnzyywlgpmgtmube.supabase.co" />
        </head>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <RegionProvider>
              <div className="flex h-screen dark:bg-black/30">
                <Sidebar />
                <main className="flex-1 overflow-auto pt-16 md:pt-0">
                  {children}
                </main>
              </div>
            </RegionProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
