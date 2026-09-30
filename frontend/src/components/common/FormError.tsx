import type { ReactNode } from "react";

export default function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-200"
    >
      {children}
    </div>
  );
}
