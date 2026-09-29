/**
 * Utility functions for reliable money calculations in Paise (1 Rupee = 100 Paise)
 * Prevents JavaScript floating-point inaccuracies.
 */

// Converts rupees (e.g. 180 or 180.50) to integer paise (e.g. 18000 or 18050)
const toPaise = (rupees) => {
  if (typeof rupees !== 'number' && typeof rupees !== 'string') return 0;
  const num = Number(rupees);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

// Converts paise (integer) to rupees (e.g. 18000 -> 180.00)
const toRupees = (paise) => {
  if (typeof paise !== 'number') return 0;
  return Number((paise / 100).toFixed(2));
};

// Safely calculates line total in paise
const calculateLineTotalPaise = (unitPriceRupees, quantity) => {
  const pricePaise = toPaise(unitPriceRupees);
  const qty = Number(quantity) || 0;
  return Math.round(pricePaise * qty);
};

// Calculates tax amount in paise given subtotal in paise and tax percentage
const calculateTaxPaise = (subtotalPaise, taxPercentage) => {
  const taxPct = Number(taxPercentage) || 0;
  return Math.round((subtotalPaise * taxPct) / 100);
};

module.exports = {
  toPaise,
  toRupees,
  calculateLineTotalPaise,
  calculateTaxPaise,
};
