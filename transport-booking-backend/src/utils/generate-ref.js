export const generateReference = (prefix = "TXN") => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${Date.now()}-${random}`;
};