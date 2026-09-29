/**
 * Phone number normalization and validation utilities
 */

const normalizeMobile = (mobile) => {
  if (!mobile) return '';
  // Remove all non-digit characters (+, spaces, hyphens, parentheses)
  let cleaned = String(mobile).replace(/\D/g, '');

  // If starts with 0 and has 11 digits (e.g. 09876543210), strip the leading 0
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits standard Indian number, add 91
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  // If 12 digits starting with 91, return as is
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }

  // If international number with country code already (e.g. 1-15 digits), return cleaned
  return cleaned;
};

// Returns a display-friendly 10-digit number when possible
const formatMobileDisplay = (normalizedMobile) => {
  if (!normalizedMobile) return '';
  if (normalizedMobile.startsWith('91') && normalizedMobile.length === 12) {
    return normalizedMobile.substring(2);
  }
  return normalizedMobile;
};

// Generates WhatsApp share URL
const generateWhatsAppLink = (normalizedMobile, messageText) => {
  if (!normalizedMobile) return '';
  const encodedMsg = encodeURIComponent(messageText);
  return `https://wa.me/${normalizedMobile}?text=${encodedMsg}`;
};

module.exports = {
  normalizeMobile,
  formatMobileDisplay,
  generateWhatsAppLink,
};
