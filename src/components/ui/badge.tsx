import { cn } from "@/lib/utils";

const variantMap = {
  default: "border-transparent bg-primary text-primary-foreground",
  primary: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border bg-transparent text-foreground",
  muted: "border-transparent bg-muted text-muted-foreground",
  accent: "border-transparent bg-accent text-accent-foreground",
  success: "border-transparent bg-success text-white",
  warning: "border-transparent bg-warning text-foreground",
  destructive: "border-transparent bg-destructive text-white"
} as const;

export function Badge({
  children,
  variant = "secondary",
  className
}: {
  children: React.ReactNode;
  variant?: keyof typeof variantMap;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium",
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
