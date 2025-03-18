/**
 * Utility functions for handling Ethereum addresses
 */

/**
 * Shortens an Ethereum address for display purposes
 * @param address The Ethereum address to shorten
 * @param chars Number of characters to keep at the beginning and end (default 4)
 * @returns The shortened address with ellipsis in the middle
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  
  // Check if address is a valid ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return address;
  }
  
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

/**
 * Validates if a string is a valid Ethereum address
 * @param address The address to validate
 * @returns True if the address is valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Converts a checksummed address to lowercase
 * @param address The Ethereum address to convert
 * @returns The lowercase address
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  return address.toLowerCase();
} 