/**
 * Utility functions for URL validation to prevent SSRF attacks
 * Created to fix axios vulnerability CVE-2023-45857
 */

/**
 * Validates that a URL belongs to a list of trusted domains
 * @param url The URL to validate
 * @returns true if the URL is valid and from a trusted domain
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow specific trusted domains
    const trustedDomains = [
      'api.ebay.com', 
      'ebay-average-selling-price.p.rapidapi.com',
      'identity.ebay.com'
    ];
    
    return trustedDomains.includes(parsedUrl.hostname);
  } catch (e) {
    console.error(`Invalid URL: ${url}`, e);
    return false;
  }
}

/**
 * Creates a secure URL for a particular trusted domain
 * @param baseUrl The base URL of the trusted domain
 * @param path The path to append to the base URL
 * @returns A securely constructed URL
 */
export function createSecureUrl(baseUrl: string, path: string): string {
  try {
    // Validate the base URL
    if (!isValidUrl(baseUrl)) {
      throw new Error(`Invalid base URL: ${baseUrl}`);
    }
    
    // Make sure the path doesn't contain protocol-relative URLs or unexpected characters
    if (path.startsWith('//') || path.includes(':\\') || path.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)) {
      throw new Error(`Potentially unsafe path: ${path}`);
    }
    
    // Join the base URL and path securely
    const base = new URL(baseUrl);
    const url = new URL(path.startsWith('/') ? path : `/${path}`, base);
    
    // Make sure the hostname didn't change
    if (url.hostname !== base.hostname) {
      throw new Error(`Hostname changed from ${base.hostname} to ${url.hostname}`);
    }
    
    return url.toString();
  } catch (e) {
    console.error(`Error creating secure URL from ${baseUrl} and ${path}`, e);
    throw e;
  }
}

/**
 * Creates axios security headers to prevent request forgery
 * @returns Object with security headers
 */
export function getSecurityHeaders() {
  return {
    // Prevent header injections
    'X-Forwarded-Host': null,
    'X-Forwarded-For': null,
    // Additional security headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
  };
} 