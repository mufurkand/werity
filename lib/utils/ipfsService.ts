/**
 * IPFS Service for uploading and retrieving files from IPFS
 */

export interface IPFSUploadResponse {
  Name: string;
  Hash: string;
  Size: string;
}

/**
 * Upload a file to IPFS
 * @param file File to upload
 * @returns IPFS response containing hash of uploaded file
 */
export async function uploadToIPFS(file: File): Promise<IPFSUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5001/api/v0/add', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

/**
 * Get a data URL for an image stored in IPFS
 * @param hash IPFS hash
 * @returns Promise that resolves to a data URL for the image, or null if fetch fails
 */
export async function fetchIPFSImage(hash: string): Promise<string | null> {
  try {
    const response = await fetch(`http://localhost:5001/api/v0/cat?arg=${hash}`, {
      method: 'POST',
    });

    if (!response.ok) {
      console.warn(`IPFS fetch failed for hash ${hash}: ${response.statusText}`);
      return null;
    }

    // Get the binary data
    const blob = await response.blob();
    
    // Convert to data URL
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn('Error fetching from IPFS:', error);
    return null;
  }
}

/**
 * Get the IPFS gateway URL for a given IPFS hash
 * @param hash IPFS hash
 * @returns URL to access the file
 */
export function getIPFSUrl(hash: string): string {
  // For local IPFS node
  return `http://localhost:5001/api/v0/cat?arg=${hash}`;
}

/**
 * Convert an IPFS hash to an IPFS URI
 * @param hash IPFS hash
 * @returns IPFS URI (ipfs://hash)
 */
export function hashToIpfsUri(hash: string): string {
  return `ipfs://${hash}`;
}

/**
 * Extract hash from IPFS URI
 * @param uri IPFS URI (ipfs://hash)
 * @returns IPFS hash
 */
export function ipfsUriToHash(uri: string): string {
  if (!uri) return '';
  return uri.replace('ipfs://', '');
}

/**
 * Upload multiple media files to IPFS
 * @param files Array of files to upload
 * @returns Array of IPFS responses containing hashes of uploaded files
 */
export async function uploadMultipleToIPFS(files: File[]): Promise<IPFSUploadResponse[]> {
  const uploadPromises = files.map(file => uploadToIPFS(file));
  return Promise.all(uploadPromises);
}

/**
 * Format post content with IPFS references
 * @param text Post text content
 * @param ipfsHashes Array of IPFS hashes to include
 * @returns Formatted post content with text and IPFS references
 */
export function formatPostContent(text: string, ipfsHashes: string[]): string {
  if (ipfsHashes.length === 0) {
    return text;
  }
  
  const ipfsReferences = ipfsHashes.map(hash => `ipfs:${hash}`).join(' ');
  return `${text} ${ipfsReferences}`;
}

/**
 * Extract IPFS hashes from post content
 * @param content Post content
 * @returns Object containing clean text and array of IPFS hashes
 */
export function parsePostContent(content: string): { text: string, mediaHashes: string[] } {
  const mediaHashes: string[] = [];
  
  // Extract all ipfs: references
  const ipfsRegex = /ipfs:([a-zA-Z0-9]+)/g;
  let match;
  
  while ((match = ipfsRegex.exec(content)) !== null) {
    if (match[1]) {
      mediaHashes.push(match[1]);
    }
  }
  
  // Remove all ipfs: references from the text
  const cleanText = content.replace(/\s*ipfs:[a-zA-Z0-9]+\s*/g, ' ').trim();
  
  return { text: cleanText, mediaHashes };
} 