import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateYearOptions() {
  const years = [];
  for (let year = 2025; year >= 1950; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
}
