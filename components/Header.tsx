"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onCreateEvent: () => void;
}

export default function Header({ onCreateEvent }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <div className="flex items-center justify-between mb-8 backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 p-6 shadow-lg">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Welcome, {session?.user?.name}!
        </h1>
        <p className="mt-1 text-sm text-zinc-900">
          Browse all events
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onCreateEvent} className="backdrop-blur-sm">
          + New Event
        </Button>
        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          variant="outline"
          className="backdrop-blur-sm"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
