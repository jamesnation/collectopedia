"use client"

import dynamic from 'next/dynamic'

const CatalogPageComponent = dynamic(() => import('./catalog-page').then(mod => mod.CatalogPageComponent), {
  ssr: false,
})

export function CatalogPageWrapper() {
  return <CatalogPageComponent />
}