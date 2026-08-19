/**
 * Formats a number into Indian Rupee currency format (INR - ₹) using Indian numbering system.
 * Examples:
 * 500 -> ₹500
 * 1250 -> ₹1,250
 * 12500 -> ₹12,500
 * 125000 -> ₹1,25,000
 * 1050000 -> ₹10,50,000
 */
export const formatINR = (amount, showSymbol = true) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return showSymbol ? "₹0" : "0";
  }

  const num = Math.round(Number(amount));
  const formatted = new Intl.NumberFormat("en-IN").format(num);

  return showSymbol ? `₹${formatted}` : formatted;
};

export default formatINR;
