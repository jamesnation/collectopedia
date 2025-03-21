"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BarChart, LineChart, Package, Search, TrendingUp } from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { motion } from "framer-motion"
import Link from 'next/link'
import { SignedIn, SignedOut } from "@clerk/nextjs"

const sampleData = [
  { month: "Jan", value: 1000 },
  { month: "Feb", value: 1200 },
  { month: "Mar", value: 1100 },
  { month: "Apr", value: 1300 },
  { month: "May", value: 1500 },
  { month: "Jun", value: 1400 },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/90 to-black text-gray-100">
      <header className="hidden md:block sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-16">
            <nav className="flex space-x-4">
              <SignedIn>
                <Link href="/my-collection">
                  <Button variant="default" className="bg-purple-600 text-white hover:bg-purple-700">
                    My Collection
                  </Button>
                </Link>
              </SignedIn>
              <SignedOut>
                <Link href="/signup">
                  <Button variant="default" className="bg-purple-600 text-white hover:bg-purple-700">
                    Sign Up
                  </Button>
                </Link>
              </SignedOut>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="relative py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <motion.div
                className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Value Your</span>
                  <span className="block text-purple-400">Collection</span>
                </h1>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                  Collectopedia is the intelligent financial dashboard for collectors. Track and analyze your
                  collection with real-time pricing insights.
                </p>
                <div className="mt-8">
                  <p className="text-base font-medium text-white">
                    Start your free trial today.
                  </p>
                  <div className="mt-3">
                    <Link href="/signup">
                      <Button
                        type="button"
                        className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <LineChart className="h-6 w-6 text-purple-400" />
                        <span>Collection Value Trend</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={sampleData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                borderColor: "#4B5563",
                                color: "#E5E7EB",
                              }}
                              labelStyle={{ color: "#E5E7EB" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#8B5CF6"
                              strokeWidth={3}
                              dot={{ fill: "#8B5CF6", strokeWidth: 2 }}
                              activeDot={{ r: 8 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-purple-400 font-semibold tracking-wide uppercase">Collectopedia</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
               The Collectables Financial Dashboard
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-300 lg:mx-auto">
                Our tools will revolutionize how you manage and value your collection.
              </p>
            </div>

            <div className="mt-16">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {[
                  {
                    name: "Real-Time Pricing",
                    description: "Stay ahead with live market values for your collectibles, updated in real-time.",
                    icon: TrendingUp,
                  },
                  {
                    name: "Advanced Analytics",
                    description:
                      "Gain deep insights into your collection's performance with comprehensive statistics and reports.",
                    icon: BarChart,
                  },
                  {
                    name: "Smart Cataloging",
                    description:
                      "Effortlessly organize and manage your prized possessions with our intuitive cataloging system.",
                    icon: Search,
                  },
                  {
                    name: "Market Predictions",
                    description:
                      "Make informed decisions with our AI-powered market trend predictions and recommendations.",
                    icon: LineChart,
                  },
                ].map((feature) => (
                  <div key={feature.name} className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-white">{feature.name}</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-400">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to value your collection?</span>
              <span className="block text-purple-400">Try Collectopedia for free today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-gray-300">
           Value your collection now.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button className="bg-purple-600 text-white hover:bg-purple-700">Get started</Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="bg-gray-900">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-500" />
                <span className="text-xl font-bold ml-3 bg-gradient-to-r from-purple-500 to-pink-500 inline-block text-transparent bg-clip-text">Collectopedia</span>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-800 pt-8 text-center">
              <p className="text-base text-gray-400">&copy; 2025 Collectopedia, Inc. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
