import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combine classNames with tailwind merge
 * @param inputs - CSS classes to combine
 * @returns - Merged classnames
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
