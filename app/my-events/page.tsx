"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Event } from "../types/event";
import EventCard from "../../components/EventCards";
import { Button } from "@/components/ui/button";
import CreateEventModal from "../../components/CreateEventModal";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (eventId: string, imageUrl?: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    setDeletingId(eventId);

    try {
      // Delete image from storage if it exists
      if (imageUrl) {
        const imagePath = imageUrl.split("/").pop();
        if (imagePath) {
          await supabase.storage.from("event-images").remove([imagePath]);
        }
      }

      // Delete event from database
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", session?.user?.id); // Extra security check

      if (error) throw error;

      // Update local state
      setEvents(events.filter((event) => event.id !== eventId));
      alert("Event deleted successfully!");
    } catch (error: unknown) {
      console.error("Error deleting event:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete event"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg dark:text-zinc-400">Loading...</div>
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

        {/* Events Table */}
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
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <Table>
                <TableCaption>A list of your created events.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {event.image_url ? (
                          <div className="relative h-16 w-16 rounded-md overflow-hidden">
                            <Image
                              src={event.image_url}
                              alt={event.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-zinc-100 dark:bg-zinc-700" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {event.category}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(event.event_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        {event.time_from && event.time_to ? (
                          <span className="text-sm">
                            {event.time_from} - {event.time_to}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.location || (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(event.id, event.image_url)
                            }
                            disabled={deletingId === event.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                          >
                            {deletingId === event.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
