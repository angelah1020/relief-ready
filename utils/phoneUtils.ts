/**
 * Phone number formatting utilities
 */

/**
 * Format phone number as (000) 000-0000
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);
  
  // Format based on length
  if (limitedDigits.length <= 3) {
    return limitedDigits;
  } else if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  } else {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  }
};

/**
 * Get clean digits from formatted phone number
 */
export const getPhoneDigits = (formattedPhone: string): string => {
  return formattedPhone.replace(/\D/g, '').slice(0, 10);
};

/**
 * Validate phone number (must be exactly 10 digits)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const digits = getPhoneDigits(phone);
  return digits.length === 10;
};
