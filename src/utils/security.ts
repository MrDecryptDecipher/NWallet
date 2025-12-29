// Basic security utility for local interactions
// Exponential Improvement: Local Data Security
// Ensure sensitive data like user preferences or non-custodial keys (if any) are treated with care.

export const sanitizeInput = (input: string): string => {
  return input.replace(/<[^>]*>?/gm, '');
};

// Placeholder for future AES implementation if local storage is used for sensitive data
export const encryptLocalData = async (data: string, key: string): Promise<string> => {
    // Implementation would go here using Web Crypto API
    return btoa(data); // MOCK for demonstration
};
