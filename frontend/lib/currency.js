// Currency labels shown in the selector. Actual conversion rates come from
// the backend's /fx/ endpoint (live, free feed) when available; this static
// table is only the last-resort fallback if that feed is unreachable.
export const CURRENCIES = {
  USD: { label: "US Dollar" },
  NGN: { label: "Nigerian Naira" },
  VND: { label: "Vietnamese Dong" },
  KES: { label: "Kenyan Shilling" },
  EUR: { label: "Euro" },
  GBP: { label: "British Pound" },
};

const FALLBACK_RATES = { USD: 1, NGN: 1550, VND: 25400, KES: 129, EUR: 0.92, GBP: 0.79 };

// `rates` (optional) is the { USD: 1, NGN: 1550, ... } map from useFxRates().
// Falls back to the static table if rates aren't loaded yet or a code is missing.
export function convert(amount, fromCode, toCode, rates) {
  const table = rates || FALLBACK_RATES;
  const from = table[fromCode] ?? FALLBACK_RATES[fromCode] ?? 1;
  const to = table[toCode] ?? FALLBACK_RATES[toCode] ?? 1;
  const usd = amount / from;
  return usd * to;
}

export function formatCurrency(amount, code) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}
