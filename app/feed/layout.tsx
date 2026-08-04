"use client";
import { ReactNode } from "react";
import { InstaGroProvider } from "@/lib/instagro-store";

export default function FeedLayout({ children }: { children: ReactNode }) {
  return <InstaGroProvider>{children}</InstaGroProvider>;
}
