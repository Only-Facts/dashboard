import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}

export default function FormField({ label, htmlFor, children, hint }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {label}
      <span className="mt-2 block">{children}</span>
      {hint && (
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}
