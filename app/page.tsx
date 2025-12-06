"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Event } from "./types/event";
import EventCard from "../components/EventCards";
import Image from "next/image";

export default function Home() {
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

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <div className="py-14 flex flex-col md:flex-row items-center justify-center gap-10">
          <div>
            <h1 className="text-6xl font-bold tracking-tight text-zinc-50 mb-4">
              Discover Amazing Events
            </h1>
            <p className="text-xl text-zinc-300">
              Secure your spot and join the most anticipated events happening near you. RSVP is quick and easy!
            </p>
          </div>

          <Image
            src="/meet.svg"
            alt="Hero Image"
            width={500}
            height={200}
          />
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-50">All Events</h2>

          {loading ? (
            <div className="text-center py-12 text-zinc-400">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800 rounded-lg border border-zinc-700">
              <p className="text-zinc-400">No events available at this time.</p>
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
    </div>
  );
}
