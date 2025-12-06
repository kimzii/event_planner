import { Event } from "../app/types/event";
import Image from "next/image";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="relative group h-full">
      {/* Gradient border wrapper */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>

      {/* Card content */}
      <div className="relative h-full bg-white rounded-lg border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
        {event.image_url && (
          <div className="relative h-48 w-full flex-shrink-0">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              loading="eager"
            />
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          {event.category && (
            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full mb-2 w-fit">
              {event.category}
            </span>
          )}
          <h3 className="font-semibold text-lg text-zinc-900 mb-2">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-sm text-zinc-600 mb-4 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="space-y-1 text-sm mt-auto">
            <p className="text-zinc-700">
              📅 {new Date(event.event_date).toLocaleDateString()}
            </p>
            {event.time_from && event.time_to && (
              <p className="text-zinc-700">
                🕒 {event.time_from} - {event.time_to}
              </p>
            )}
            {event.location && (
              <p className="text-zinc-700">📍 {event.location}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
