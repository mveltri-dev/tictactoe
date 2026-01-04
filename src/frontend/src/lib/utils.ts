import { clsx, type ClassValue } from 'clsx'

/**
 * Utilitaire pour combiner les classes CSS conditionnellement
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

