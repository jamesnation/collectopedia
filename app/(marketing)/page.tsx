import React from 'react'
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Main content */}
      <main className="flex-grow">
        <div className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <svg className="w-full h-full" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_f)">
                <circle cx="500" cy="500" r="300" fill="url(#paint0_radial)" />
              </g>
              <defs>
                <filter id="filter0_f" x="0" y="0" width="1000" height="1000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                  <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur"/>
                </filter>
                <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(500 500) rotate(90) scale(300)">
                  <stop stopColor="#8B5CF6" stopOpacity="0.6"/>
                  <stop offset="1" stopColor="#8B5CF6" stopOpacity="0"/>
                </radialGradient>
              </defs>
            </svg>
          </div>
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Simplify Your Collection Management
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                No nonsense. Just an easy way to track your collectibles and their value.
              </p>
              <div className="flex justify-center mb-12">
                <Button className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-3 text-lg">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/images/placeholder-dashboard.png"
                alt="Collectopedia Dashboard"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              About Collectopedia
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              We believe in keeping things simple. Collectopedia is built for collectors who want a straightforward, 
              no-frills way to manage their collections and track their value.
            </p>
          </div>
        </section>

        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="container mx-auto text-center">
            <p className="text-sm text-gray-500">&copy; 2024 Collectopedia. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
