import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-lg border bg-card/70 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-ink-muted focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

interface ShellProps extends FieldProps {
  id: string;
  children: ReactNode;
}

function Shell({ id, label, error, hint, required, className, children }: ShellProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-primary">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="mt-1 text-xs text-primary">{error}</p> : hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(function Input(
  { label, error, hint, required, className, ...rest },
  ref,
) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <input id={id} ref={ref} aria-invalid={error ? true : undefined} className={cn(CONTROL, error ? "border-primary" : "border-line")} {...rest} />
    </Shell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { label, error, hint, required, className, rows = 4, ...rest },
  ref,
) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea id={id} ref={ref} rows={rows} aria-invalid={error ? true : undefined} className={cn(CONTROL, error ? "border-primary" : "border-line")} {...rest} />
    </Shell>
  );
});

export const Select = forwardRef<HTMLSelectElement, FieldProps & SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { label, error, hint, required, className, children, ...rest },
  ref,
) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <select id={id} ref={ref} aria-invalid={error ? true : undefined} className={cn(CONTROL, error ? "border-primary" : "border-line")} {...rest}>
        {children}
      </select>
    </Shell>
  );
});
