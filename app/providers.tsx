"use client";

import { Toaster } from "sonner";
import { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <Toaster 
        position="top-right" 
        richColors
        closeButton
        theme="dark"
      />
      {children}
    </>
  );
} 