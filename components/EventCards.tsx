import { Event } from "@/app/types/event";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const router = useRouter();

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => router.push(`/events/${event.id}`)}
    >
      {event.image_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <CardHeader>
        {event.category && (
          <Badge variant="secondary" className="w-fit mb-2">
            {event.category}
          </Badge>
        )}
        <CardTitle className="line-clamp-2">{event.title}</CardTitle>
        {event.description && (
          <CardDescription className="line-clamp-2">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>
            {new Date(event.event_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {event.time_from && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{event.time_from}</span>
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/events/${event.id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
