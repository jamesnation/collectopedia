import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar";
import { auth } from "@clerk/nextjs/server";
import { getProfileByUserIdAction } from "@/actions/profiles-actions";
import { createProfile } from "@/db/queries/profiles-queries";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collectopedia",
  description: "Manage your collection with ease",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  
  console.log("Root Layout - User ID:", userId);

  if (userId) {
    try {
      console.log("Checking for existing profile...");
      const res = await getProfileByUserIdAction(userId);
      console.log("Profile check result:", res);
      
      if (!res.data) {
        console.log("No profile found, creating new profile...");
        const newProfile = await createProfile({ userId });
        console.log("New profile created:", newProfile);
      }
    } catch (error) {
      console.error("Error in profile creation flow:", error);
    }
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex h-screen dark:bg-black/30">
              <Sidebar />
              <main className="flex-1 overflow-auto pt-16 md:pt-0">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
