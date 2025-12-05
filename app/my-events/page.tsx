"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Event } from "../types/event";
import EventCard from "../../components/EventCards";
import { Button } from "@/components/ui/button";
import CreateEventModal from "../../components/CreateEventModal";

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchEvents();
    }
  }, [session]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", session?.user?.id)
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg dark:text-zinc-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
              My Events
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage your created events
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>+ New Event</Button>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                You haven&apos;t created any events yet.
              </p>
              <Button onClick={() => setShowModal(true)}>
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateEventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEventCreated={fetchEvents}
      />
    </div>
  );
}
