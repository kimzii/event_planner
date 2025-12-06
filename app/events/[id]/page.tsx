"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { Event } from "../../types/event";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, MapPin, Tag } from "lucide-react";
import EventCard from "../../../components/EventCards";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchEvent(params.id as string);
    }
  }, [params.id]);

  const fetchEvent = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setEvent(data);

      // Fetch related events after getting the main event
      if (data && data.category) {
        await fetchRelatedEvents(id, data.category, data.event_date);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedEvents = async (
    currentEventId: string,
    category: string,
    currentEventDate: string
  ) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("category", category)
        .neq("id", currentEventId) // Exclude current event
        .gte("event_date", currentEventDate) // Only upcoming events
        .order("event_date", { ascending: true })
        .limit(3); // Limit to 3 related events

      if (error) throw error;

      setRelatedEvents(data || []);
    } catch (error) {
      console.error("Error fetching related events:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-zinc-400">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-50 mb-4">
            Event not found
          </h2>
          <Button onClick={() => router.push("/")}>Back to Events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-zinc-300 hover:text-zinc-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Detail */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {/* Event Image */}
              {event.image_url && (
                <div className="relative h-96 w-full">
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Event Content */}
              <div className="p-8">
                {/* Category Badge */}
                {event.category && (
                  <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 rounded-full mb-4">
                    <Tag className="mr-1 h-3 w-3" />
                    {event.category}
                  </span>
                )}

                {/* Title */}
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
                  {event.title}
                </h1>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Date
                      </p>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        {new Date(event.event_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  {event.time_from && event.time_to && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Time
                        </p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {event.time_from} - {event.time_to}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Location
                        </p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {event.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
                    <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                      About this event
                    </h2>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 flex gap-4">
                  <Button size="lg" className="flex-1">
                    RSVP to Event
                  </Button>
                  <Button variant="outline" size="lg">
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Events Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold text-zinc-50 mb-4">
                Related Events
              </h2>

              {relatedEvents.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-center">
                  <p className="text-zinc-400">
                    No related events available at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {relatedEvents.map((relatedEvent) => (
                    <EventCard key={relatedEvent.id} event={relatedEvent} />
                  ))}
                </div>
              )}

              {relatedEvents.length > 0 && event.category && (
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-white/10 border-white/20 text-zinc-50 hover:bg-white/20"
                  onClick={() => router.push(`/?category=${event.category}`)}
                >
                  View all {event.category} events
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
