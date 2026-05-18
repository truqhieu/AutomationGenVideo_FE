"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { UserRole } from "@/types/auth";

const ALLOWED_ROLES = [UserRole.ADMIN, UserRole.MANAGER];

export default function AiLayout({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((s) => s.user);
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        const hasAccess = user.roles?.some((r) => ALLOWED_ROLES.includes(r as UserRole));
        if (!hasAccess) {
            router.replace("/dashboard");
        }
    }, [user, router]);

    if (!user) return null;

    const hasAccess = user.roles?.some((r) => ALLOWED_ROLES.includes(r as UserRole));
    if (!hasAccess) return null;

    return <>{children}</>;
}
