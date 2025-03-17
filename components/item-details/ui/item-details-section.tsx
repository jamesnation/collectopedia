"use client";

/**
 * components/item-details/ui/item-details-section.tsx
 * 
 * This component manages the right column of the item details page,
 * including the item header, metrics, and details card.
 * Enhanced with smooth loading transitions using Framer Motion.
 */

import { useItemDetails } from "../context";
import { ItemHeader } from "./item-header";
import { ItemMetricsSection } from "./item-metrics-section";
import { ItemDetailsCard } from "./item-details-card";
import { motion } from "framer-motion";

export function ItemDetailsSection() {
  const { item } = useItemDetails();

  if (!item) return null;

  // Animation variants for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item_animation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Item Header */}
      <motion.div variants={item_animation}>
        <ItemHeader />
      </motion.div>
      
      {/* Metrics Section - combines ItemMetrics and ProfitMetrics */}
      <motion.div variants={item_animation}>
        <ItemMetricsSection />
      </motion.div>
      
      {/* Item Details Card - includes all item information fields */}
      <motion.div variants={item_animation}>
        <ItemDetailsCard />
      </motion.div>
    </motion.div>
  );
} 