"use client";

import { Toaster as Sonner } from "sonner";

export type { ExternalToast as Toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      expand={false} // keeps toasts compact
      duration={3000} // auto close after 3s
    />
  );
}
