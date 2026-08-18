import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const variantMap = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border-border bg-transparent text-foreground hover:bg-muted",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
  destructive: "border-transparent bg-destructive text-white hover:opacity-90",
  accent: "border-transparent bg-accent text-accent-foreground hover:opacity-90"
} as const;

const sizeMap = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-10 w-10"
} as const;

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizeMap;
  className?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  target?: "_blank" | "_self";
  rel?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  href,
  variant = "default",
  size = "md",
  className,
  leadingIcon,
  trailingIcon,
  target,
  rel,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    variantMap[variant],
    sizeMap[size],
    className
  );

  const content = (
    <>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </>
  );

  if (href) {
    const linkProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <Link href={href} className={classes} target={target} rel={rel} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
}
