"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/UserContext";

const PUBLIC_PATHS = ["/login", "/admin"];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (!isPublic && !user) {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  // Show nothing while checking auth on protected routes
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!isPublic && (loading || !user)) {
    return null;
  }

  return <>{children}</>;
}
