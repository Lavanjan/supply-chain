const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
