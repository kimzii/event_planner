"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Event } from "./types/event";
import EventCard from "../components/EventCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const categories = [
  "All",
  "Conference",
  "Workshop",
  "Seminar",
  "Networking",
  "Social",
  "Sports",
  "Concert",
  "Festival",
  "Fundraiser",
  "Other",
];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedCategory === "All" || event.category === selectedCategory;

    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());

    // Date filter: show events from selected date onwards
    const matchesDate = selectedDate
      ? new Date(event.event_date) >= selectedDate
      : true;

    return matchesCategory && matchesSearch && matchesDate;
  });

  const clearFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    setSelectedDate(undefined);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl text-primary-foreground font-bold mb-2">Discover Events</h1>
        <p className="text-muted">
          Find and join exciting events happening around you
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
              {selectedDate && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setSelectedDate(undefined)}
                  >
                    Clear Date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Category Tabs */}
        <Tabs
          defaultValue="All"
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="mt-6"
        >
          <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-muted/50 p-2">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Active Filters Display */}
        {(selectedCategory !== "All" || searchQuery || selectedDate) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
            {selectedCategory !== "All" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedCategory("All")}
              >
                {selectedCategory} ×
              </Button>
            )}
            {searchQuery && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Search: &ldquo;{searchQuery}&rdquo; ×
              </Button>
            )}
            {selectedDate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDate(undefined)}
              >
                From: {format(selectedDate, "MMM dd, yyyy")} ×
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              Clear All
            </Button>
          </div>
        )}
      </Card>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredEvents.length}{" "}
            {filteredEvents.length === 1 ? "event" : "events"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
