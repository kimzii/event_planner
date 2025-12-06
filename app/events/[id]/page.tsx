"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { Event } from "../../types/event";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Check,
  X,
} from "lucide-react";
import EventCard from "../../../components/EventCards";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const RSVP_STATUS = {
  ATTENDING: "attending",
  NOT_ATTENDING: "not_attending",
} as const;

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchEvent(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (event && session?.user?.id) {
      checkRsvpStatus(event.id, session.user.id);
      fetchRsvpCount(event.id);
    } else if (event) {
      fetchRsvpCount(event.id);
    }
  }, [event, session]);

  const fetchEvent = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setEvent(data);

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
        .neq("id", currentEventId)
        .gte("event_date", currentEventDate)
        .order("event_date", { ascending: true })
        .limit(3);

      if (error) throw error;

      setRelatedEvents(data || []);
    } catch (error) {
      console.error("Error fetching related events:", error);
    }
  };

  const checkRsvpStatus = async (eventId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("rsvps")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking RSVP status:", error);
        return;
      }

      setRsvpStatus(data?.status || null);
    } catch (error) {
      console.error("Error checking RSVP status:", error);
    }
  };

  const fetchRsvpCount = async (eventId: string) => {
    try {
      const { count, error } = await supabase
        .from("rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", RSVP_STATUS.ATTENDING);

      if (error) {
        console.error("Error fetching RSVP count:", error);
        return;
      }

      setRsvpCount(count || 0);
    } catch (error) {
      console.error("Error in fetchRsvpCount:", error);
    }
  };

  const handleRsvp = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to RSVP", {
        description: "You need to be logged in to RSVP to events.",
      });
      router.push("/login");
      return;
    }

    if (!event) return;

    setRsvpLoading(true);

    try {
      // Create RSVP
      const { error } = await supabase.from("rsvps").insert({
        event_id: event.id,
        user_id: session.user.id,
        status: RSVP_STATUS.ATTENDING,
      });

      if (error) throw error;

      // Update UI immediately
      setRsvpStatus(RSVP_STATUS.ATTENDING);
      setRsvpCount((prev) => prev + 1);

      toast.success("RSVP confirmed!", {
        description: `You're attending "${event.title}"`,
      });

      // Refetch data to sync UI with database
      await checkRsvpStatus(event.id, session.user.id);
      await fetchRsvpCount(event.id);
    } catch (error) {
      console.error("Error creating RSVP:", error);
      toast.error("Failed to RSVP", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });

      // Refetch on error to ensure UI is in sync
      if (event && session?.user?.id) {
        await checkRsvpStatus(event.id, session.user.id);
        await fetchRsvpCount(event.id);
      }
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in", {
        description: "You need to be logged in to cancel RSVP.",
      });
      return;
    }

    if (!event) return;

    setRsvpLoading(true);

    try {
      console.log("Deleting RSVP for:", {
        event_id: event.id,
        user_id: session.user.id,
      });

      // Delete RSVP
      const { error, count } = await supabase
        .from("rsvps")
        .delete({ count: "exact" })
        .eq("event_id", event.id)
        .eq("user_id", session.user.id);

      console.log("Delete count:", count);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      // Update UI immediately
      setRsvpStatus(null);
      setRsvpCount((prev) => Math.max(0, prev - 1));

      toast.success("RSVP cancelled", {
        description: "You have cancelled your RSVP for this event.",
      });

      // Refetch data to sync UI with database
      await checkRsvpStatus(event.id, session.user.id);
      await fetchRsvpCount(event.id);
    } catch (error) {
      console.error("Error cancelling RSVP:", error);
      toast.error("Failed to cancel RSVP", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });

      // Refetch on error to ensure UI is in sync
      if (event && session?.user?.id) {
        await checkRsvpStatus(event.id, session.user.id);
        await fetchRsvpCount(event.id);
      }
    } finally {
      setRsvpLoading(false);
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

                {/* RSVP Count */}
                {rsvpCount > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(rsvpCount, 3))].map((_, i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-white text-xs font-semibold"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {rsvpCount}
                      </span>{" "}
                      {rsvpCount === 1 ? "person" : "people"} attending
                    </p>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div className="mt-6">
                    <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                      About this event
                    </h2>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  {rsvpStatus === RSVP_STATUS.ATTENDING ? (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex-1">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-300 font-medium">
                          You&apos;re Attending
                        </span>
                      </div>
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleCancelRsvp}
                        disabled={rsvpLoading}
                      >
                        {rsvpLoading ? (
                          "Cancelling..."
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Cancel RSVP
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={handleRsvp}
                      disabled={rsvpLoading}
                    >
                      {rsvpLoading ? "Processing..." : "RSVP to Event"}
                    </Button>
                  )}
                  <Button variant="outline" size="lg">
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Event Details Card */}
              <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                  Event Details
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Date
                      </p>
                      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
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
                      <Clock className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Time
                        </p>
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {event.time_from} - {event.time_to}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Location
                        </p>
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {event.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Events */}
              <div>
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
    </div>
  );
}
