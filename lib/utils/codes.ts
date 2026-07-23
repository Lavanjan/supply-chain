export function generateSku(prefix = "SKU"): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

export function generateBarcode(): string {
  let code = "";
  for (let i = 0; i < 12; i++) code += Math.floor(Math.random() * 10);
  return code;
}
