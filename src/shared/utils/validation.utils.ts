/**
 * Standard utility functions for input validation across the system.
 */

/**
 * Validates if a string is a correctly formatted email address.
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a string is a valid mobile number (10-15 digits, optional + prefix).
 */
export const validateMobile = (mobile: string): boolean => {
  const mobileRegex = /^\+?[1-9]\d{9,14}$/;
  return mobileRegex.test(mobile);
};
