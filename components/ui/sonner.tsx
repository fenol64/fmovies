"use client";

import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        style: {
          background: "oklch(0.21 0.016 55)",
          color: "oklch(0.96 0.01 85)",
          border: "1px solid oklch(0.34 0.02 65)",
        },
      }}
    />
  );
}

export { Toaster };
