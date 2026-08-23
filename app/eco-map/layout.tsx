import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eco Map — GreenDuty",
  description: "Community environmental action and pollution reporting",
};

export default function EcoMapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
