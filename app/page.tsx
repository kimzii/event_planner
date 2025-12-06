"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Event } from "./types/event";
import EventCard from "../components/EventCards";
import EventFilters from "../components/EventFilters";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTitle, selectedCategory, selectedDate]);

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

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by title (search)
    if (searchTitle.trim()) {
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(
        (event) => event.category === selectedCategory
      );
    }

    // Filter by date - show events from selected date onwards
    if (selectedDate) {
      filtered = filtered.filter((event) => event.event_date >= selectedDate);
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchTitle("");
    setSelectedCategory("all");
    setSelectedDate("");
  };

  const hasActiveFilters = Boolean(
    searchTitle || selectedCategory !== "all" || selectedDate
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <div className="py-18 flex flex-col md:flex-row items-center justify-center gap-10">
          <div>
            <h1 className="text-6xl font-bold tracking-tight text-zinc-50 mb-4">
              Discover Amazing Events
            </h1>
            <p className="text-xl text-zinc-300">
              Secure your spot and join the most anticipated events happening
              near you. RSVP is quick and easy!
            </p>
          </div>

          <Image src="/meet.svg" alt="Hero Image" width={500} height={200} />
        </div>

        {/* Filter Section */}
        <EventFilters
          searchTitle={searchTitle}
          selectedCategory={selectedCategory}
          selectedDate={selectedDate}
          onSearchChange={setSearchTitle}
          onCategoryChange={setSelectedCategory}
          onDateChange={setSelectedDate}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Events List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-zinc-50">
              {selectedDate
                ? `Events from ${new Date(selectedDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )} onwards`
                : "All Events"}
            </h2>
            <span className="text-sm text-zinc-400">
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? "s" : ""} found
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-zinc-400">
              Loading events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800 rounded-lg border border-zinc-700">
              <p className="text-zinc-400 mb-2">
                {hasActiveFilters
                  ? "No events match your filters."
                  : "No events available at this time."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
