"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Event } from "../types/event";

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 mb-8">
          Calendar View
        </h1>

        {loading ? (
          <div className="text-center py-12 text-zinc-400">
            Loading events...
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                >
                  <div className="shrink-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {new Date(event.event_date).getDate()}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {new Date(event.event_date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {event.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {event.time_from && event.time_to && (
                        <span>
                          {event.time_from} - {event.time_to}
                        </span>
                      )}
                      {event.location && <span> • {event.location}</span>}
                    </p>
                  </div>
                  {event.category && (
                    <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 rounded-full">
                      {event.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
