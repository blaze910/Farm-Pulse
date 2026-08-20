export const metadata = {
  title: "Dashboard — FarmPulse field intelligence",
  description:
    "Live soil, weather, crop suitability and pest risk for every field zone you track.",
  openGraph: {
    title: "Dashboard — FarmPulse",
    description: "Live soil, weather, crop suitability and pest risk per field zone.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function DashboardLayout({ children }) {
  return children;
}
