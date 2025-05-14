/**
 * Utility functions for formatting blockchain addresses
 */

/**
 * Truncates a blockchain address for display purposes
 * @param address The address to truncate
 * @returns Truncated address in format "first6...last4" or empty string if address is falsy
 */
export const truncateAddress = (address: string | undefined | null): string => {
  if (!address) return "";
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
