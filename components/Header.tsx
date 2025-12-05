"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "./ui/button";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mb-8 backdrop-blur-md bg-white/30 dark:bg-zinc-800/30 rounded-2xl border border-white/20 dark:border-zinc-700/50 p-6 shadow-lg">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome, {session.user?.name}!
        </h1>
        <p className="mt-1 text-sm text-zinc-1000 dark:text-zinc-400">
          Browse all events
        </p>
      </div>
      <Button
        onClick={() => signOut({ callbackUrl: "/login" })}
        variant="default"
        className="backdrop-blur-sm"
      >
        Sign Out
      </Button>
    </div>
  );
}
