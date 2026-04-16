"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { UserRole } from "@/types/auth";
import { LeaderVideoReview } from "@/components/dashboard/a5/leader/LeaderVideoReview";

export default function VideoReviewPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const canAccess =
    user?.roles?.includes(UserRole.LEADER) ||
    user?.roles?.includes(UserRole.ADMIN) ||
    user?.roles?.includes(UserRole.MANAGER);

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  if (!user || !canAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 font-sans text-gray-900">
      <div className="px-2 py-4">

        <LeaderVideoReview />
      </div>
    </div>
  );
}
