import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  children?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "5xl";
  className?: string;
}

export function Header({ children, maxWidth = "5xl", className }: HeaderProps) {
  const maxWClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-3xl",
    xl: "max-w-4xl",
    "5xl": "max-w-5xl",
  }[maxWidth];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <div className={cn("mx-auto flex h-14 items-center justify-between px-4", maxWClass)}>
        <Link
          href="/"
          className="font-display text-lg font-bold text-foreground transition-colors hover:text-primary"
        >
          시간조율
        </Link>
        {children && <nav className="flex items-center gap-2">{children}</nav>}
      </div>
    </header>
  );
}
