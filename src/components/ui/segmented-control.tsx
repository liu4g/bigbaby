import Link from "next/link";
import { cn } from "@/lib/utils";

export function SegmentedControl({
  items
}: {
  items: Array<{ label: string; href: string; active?: boolean }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
            item.active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
