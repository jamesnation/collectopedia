import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle } from "lucide-react"
import Image from 'next/image'

export default function MinimalistHomepage() {
  return (
    <div className="min-h-screen bg-[#FDF7F5] text-gray-900 flex flex-col">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row items-center justify-between">
        <div className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0">
          <h1 className="text-4xl sm:text-5xl font-bold text-purple-900 mb-6">
            Organize your collection with ease
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Collectopedia brings your passion to life with a sleek, intuitive dashboard. Track, manage, and showcase your collectibles like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input type="email" placeholder="Enter your email" className="flex-grow" />
            <Button className="bg-purple-600 text-white hover:bg-purple-700">
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        <Card className="lg:w-1/2 shadow-2xl">
          <CardContent className="p-6">
            <div className="relative w-full aspect-video">
              <Image
                src="/images/placeholder-dashboard.png" // Use a placeholder image that exists in your public folder
                alt="Collectopedia dashboard preview"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-lg"
              />
            </div>
          </CardContent>
        </Card>
      </main>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-purple-900 mb-12">
            Why collectors love our dashboard
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              "Intuitive item cataloging",
              "Real-time value tracking",
              "Custom collection insights",
              "Sleek, minimalist design",
              "Powerful search and filter",
              "Mobile-friendly interface"
            ].map((feature, index) => (
              <div key={index} className="flex items-center">
                <CheckCircle className="h-6 w-6 text-purple-600 mr-2" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#FDF7F5] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-500">&copy; 2024 Collectopedia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
