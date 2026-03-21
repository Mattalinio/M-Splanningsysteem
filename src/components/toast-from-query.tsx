"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ToastFromQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    const message = params.get("toast");
    if (!message || shownRef.current === message) return;

    shownRef.current = message;
    toast.success(message, {
      icon: <CheckCircle2 className="h-4 w-4" />,
    });

    const newParams = new URLSearchParams(params.toString());
    newParams.delete("toast");
    const query = newParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [params, pathname, router]);

  return null;
}
