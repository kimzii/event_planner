import { Event } from "../app/types/event";
import Image from "next/image";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:shadow-md transition-shadow">
      {event.image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 mb-2">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {event.description}
          </p>
        )}
        <div className="space-y-1 text-sm">
          <p className="text-zinc-700 dark:text-zinc-300">
            📅 {new Date(event.event_date).toLocaleDateString()}
          </p>
          {event.location && (
            <p className="text-zinc-700 dark:text-zinc-300">
              📍 {event.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
