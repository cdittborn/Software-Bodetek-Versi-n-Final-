"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

function PuntoPendiente() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full bg-brand transition-opacity",
        pending ? "animate-pulse opacity-100" : "opacity-0",
      )}
    />
  );
}

type NavLinkProps = {
  href: string;
  className?: string;
  title?: string;
  children: ReactNode;
};

export function NavLink({ href, className, title, children }: NavLinkProps) {
  return (
    <Link href={href} className={className} title={title}>
      <span className="inline-flex items-center gap-1.5">
        {children}
        <PuntoPendiente />
      </span>
    </Link>
  );
}
