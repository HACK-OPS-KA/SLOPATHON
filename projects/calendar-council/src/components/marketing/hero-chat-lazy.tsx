"use client";

import dynamic from "next/dynamic";

// Load the framer-motion-powered hero chat on the client only. This keeps
// framer-motion out of the static server render (avoiding its react-server
// stub) and guarantees the marketing page always builds.
export const HeroChat = dynamic(() => import("./hero-chat").then((m) => m.HeroChat), {
  ssr: false,
  loading: () => (
    <div className="mx-auto h-[460px] w-full max-w-md animate-pulse rounded-2xl border bg-background/60 shadow-2xl" />
  ),
});
