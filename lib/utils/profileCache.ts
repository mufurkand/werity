/**
 * Profile cache to store profile data and avoid duplicate requests
 */

import { fetchIPFSImage, ipfsUriToHash } from "./ipfsService";

// In-memory cache for profiles
const profileCache: Record<string, any> = {};
const profileImageCache: Record<string, string | null> = {};
const profileImageLoadingPromises: Record<string, Promise<string | null>> = {};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Timestamps for cache entries
const cacheTimestamps: Record<string, number> = {};

/**
 * Get profile from cache or fetch it if not available
 * @param address User address
 * @param fetchFn Function to fetch profile if not in cache
 */
export async function getCachedProfile(
  address: string,
  fetchFn: () => Promise<any>
): Promise<any> {
  // Check if address is in cache and not expired
  const currentTime = Date.now();
  if (
    profileCache[address] &&
    cacheTimestamps[address] &&
    currentTime - cacheTimestamps[address] < CACHE_TTL
  ) {
    return profileCache[address];
  }

  // Fetch profile and update cache
  try {
    const profile = await fetchFn();
    profileCache[address] = profile;
    cacheTimestamps[address] = currentTime;

    // Load profile image in the background if available
    if (profile && profile.profilePhotoIPFS) {
      loadProfileImage(address, profile.profilePhotoIPFS);
    } else {
      profileImageCache[address] = null;
    }

    return profile;
  } catch (error) {
    console.error(`Error fetching profile for ${address}:`, error);
    return null;
  }
}

/**
 * Load a profile image from IPFS and cache it
 * @param address User address
 * @param ipfsUri IPFS URI
 */
async function loadProfileImage(address: string, ipfsUri: string): Promise<void> {
  try {
    const hash = ipfsUriToHash(ipfsUri);
    if (!hash || hash === 'default') {
      profileImageCache[address] = null;
      return;
    }

    // Skip if we're already loading this image
    if (address in profileImageLoadingPromises) {
      return;
    }

    // Create a loading promise to prevent duplicate fetches
    profileImageLoadingPromises[address] = fetchIPFSImage(hash);
    
    // Await the result and cache it
    const imageUrl = await profileImageLoadingPromises[address];
    
    // Check if imageUrl is null (fetch failed)
    if (imageUrl === null) {
      profileImageCache[address] = null;
    } else {
      profileImageCache[address] = imageUrl;
    }
    
    // Clean up loading promise
    delete profileImageLoadingPromises[address];
  } catch (error) {
    console.error(`Error loading profile image for ${address}:`, error);
    profileImageCache[address] = null;
    // Clean up loading promise on error
    delete profileImageLoadingPromises[address];
  }
}

/**
 * Get profile image URL from cache
 * @param address User address
 * @returns Profile image URL or null if not available
 */
export function getCachedProfileImageUrl(address: string): string | null {
  return profileImageCache[address] || null;
}

/**
 * Request profile image fetch if not already cached
 * @param address User address
 * @param ipfsUri IPFS URI 
 * @returns Promise that resolves when the image is fetched
 */
export async function requestProfileImage(address: string, ipfsUri: string): Promise<void> {
  // If already in cache, do nothing
  if (profileImageCache[address]) {
    return;
  }
  
  // If already loading, await the result
  if (address in profileImageLoadingPromises) {
    await profileImageLoadingPromises[address];
    return;
  }
  
  // Otherwise load it
  await loadProfileImage(address, ipfsUri);
}

/**
 * Clear cache for a specific address or all addresses
 * @param address Optional address to clear
 */
export function clearProfileCache(address?: string): void {
  if (address) {
    delete profileCache[address];
    
    // Revoke object URL to prevent memory leaks
    if (profileImageCache[address]) {
      URL.revokeObjectURL(profileImageCache[address]!);
    }
    
    delete profileImageCache[address];
    delete cacheTimestamps[address];
  } else {
    // Clear all cache
    Object.keys(profileCache).forEach(key => {
      // Revoke object URLs
      if (profileImageCache[key]) {
        URL.revokeObjectURL(profileImageCache[key]!);
      }
      
      delete profileCache[key];
      delete profileImageCache[key];
      delete cacheTimestamps[key];
    });
  }
} 