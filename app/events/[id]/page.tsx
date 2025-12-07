"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { Event } from "../../types/event";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Check,
  X,
  Share2,
  Facebook,
  Twitter,
  Link as LinkIcon,
} from "lucide-react";
import EventCard from "../../../components/EventCards";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      const { error } = await supabase.from("rsvps").insert({
        event_id: event.id,
        user_id: session.user.id,
        status: RSVP_STATUS.ATTENDING,
      });

      if (error) throw error;

      setRsvpStatus(RSVP_STATUS.ATTENDING);
      setRsvpCount((prev) => prev + 1);

      toast.success("RSVP confirmed!", {
        description: `You're attending "${event.title}"`,
      });

      // Send confirmation email
      if (session.user.email) {
        try {
          const eventDate = new Date(event.event_date).toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          );

          const eventTime =
            event.time_from && event.time_to
              ? `${event.time_from} - ${event.time_to}`
              : null;

          await fetch("/api/send-rsvp-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userEmail: session.user.email,
              userName: session.user.name,
              eventTitle: event.title,
              eventDate: eventDate,
              eventLocation: event.location,
              eventTime: eventTime,
            }),
          });

          toast.success("Confirmation email sent!", {
            description: "Check your inbox for event details",
          });
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }

      await checkRsvpStatus(event.id, session.user.id);
      await fetchRsvpCount(event.id);
    } catch (error) {
      console.error("Error creating RSVP:", error);
      toast.error("Failed to RSVP", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });

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
      const { error } = await supabase
        .from("rsvps")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", session.user.id);

      if (error) throw error;

      setRsvpStatus(null);
      setRsvpCount((prev) => Math.max(0, prev - 1));

      toast.success("RSVP cancelled", {
        description: "You have cancelled your RSVP for this event.",
      });

      await checkRsvpStatus(event.id, session.user.id);
      await fetchRsvpCount(event.id);
    } catch (error) {
      console.error("Error cancelling RSVP:", error);
      toast.error("Failed to cancel RSVP", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });

      if (event && session?.user?.id) {
        await checkRsvpStatus(event.id, session.user.id);
        await fetchRsvpCount(event.id);
      }
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleShareFacebook = () => {
    if (!event) return;

    const currentUrl = window.location.href;

    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      currentUrl
    )}`;

    window.open(
      facebookShareUrl,
      "facebook-share-dialog",
      "width=626,height=436"
    );

    toast.success("Opening Facebook", {
      description: "Share this event on Facebook!",
    });
  };

  const handleShareTwitter = () => {
    if (!event) return;

    const currentUrl = window.location.href;
    const eventDate = new Date(event.event_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const tweetText = `🎉 Join me at ${event.title}! 📅 ${eventDate}${
      event.location ? ` 📍 ${event.location}` : ""
    }`;

    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(currentUrl)}`;

    window.open(
      twitterShareUrl,
      "twitter-share-dialog",
      "width=626,height=436"
    );

    toast.success("Opening Twitter", {
      description: "Share this event on Twitter!",
    });
  };

  const handleCopyLink = async () => {
    if (!event) return;

    const currentUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success("Link copied!", {
        description: "Event link copied to clipboard",
      });
    } catch (error) {
      toast.error("Failed to copy link", {
        description: "Please try again",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
            <CardDescription>
              The event you&apos;re looking for doesn&apos;t exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Events
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-primary-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Detail */}
        <div className="lg:col-span-2">
          <Card>
            {event.image_url && (
              <div className="relative h-96 w-full overflow-hidden rounded-t-lg">
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <CardHeader>
              {event.category && (
                <Badge variant="secondary" className="w-fit mb-2">
                  <Tag className="mr-1 h-3 w-3" />
                  {event.category}
                </Badge>
              )}
              <CardTitle className="text-4xl">{event.title}</CardTitle>

              {rsvpCount > 0 && (
                <div className="flex items-center gap-2 pt-4">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(rsvpCount, 3))].map((_, i) => (
                      <Avatar
                        key={i}
                        className="h-8 w-8 border-2 border-background"
                      >
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                          {i + 1}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {rsvpCount}
                    </span>{" "}
                    {rsvpCount === 1 ? "person" : "people"} attending
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {event.description && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      About this event
                    </h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-4">
              {rsvpStatus === RSVP_STATUS.ATTENDING ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md flex-1">
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleShareFacebook}>
                    <Facebook className="mr-2 h-4 w-4" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareTwitter}>
                    <Twitter className="mr-2 h-4 w-4" />
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Event Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Date
                    </p>
                    <p className="text-base font-semibold">
                      {new Date(event.event_date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {event.time_from && event.time_to && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Time
                        </p>
                        <p className="text-base font-semibold">
                          {event.time_from} - {event.time_to}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {event.location && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Location
                        </p>
                        <p className="text-base font-semibold">
                          {event.location}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Related Events */}
            <div>
              <h2 className="text-2xl text-primary-foreground font-bold mb-4">Related Events</h2>

              {relatedEvents.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">
                      No related events available at this time.
                    </p>
                  </CardContent>
                </Card>
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
                  className="w-full mt-4"
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
