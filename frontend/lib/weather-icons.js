import { CloudDrizzle, CloudRain, CloudSun, Snowflake, Sun } from "lucide-react";

/** Picks an icon from numeric rain/temp values — no reliance on parsing free-text condition strings. */
export function weatherIcon({ rainMm = 0, tempC } = {}) {
  if (typeof tempC === "number" && tempC <= 2 && rainMm > 0) return Snowflake;
  if (rainMm > 8) return CloudRain;
  if (rainMm > 0.5) return CloudDrizzle;
  if (typeof tempC === "number" && tempC < 18) return CloudSun;
  return Sun;
}
