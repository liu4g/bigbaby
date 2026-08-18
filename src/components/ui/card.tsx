import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-soft", className)}>{children}</div>;
}

export function CardHeader({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-1.5 p-4 sm:p-5", className)}>{children}</div>;
}

export function CardTitle({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={cn("text-sm font-semibold leading-6 text-card-foreground", className)}>{children}</h3>;
}

export function CardDescription({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("text-sm leading-6 text-muted-foreground", className)}>{children}</p>;
}

export function CardContent({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-4 pb-4 sm:px-5 sm:pb-5", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex items-center justify-between gap-2 border-t border-border px-4 py-4 sm:px-5", className)}>{children}</div>;
}
