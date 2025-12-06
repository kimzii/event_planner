"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
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

interface EventFiltersProps {
  searchTitle: string;
  selectedCategory: string;
  selectedDate: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function EventFilters({
  searchTitle,
  selectedCategory,
  selectedDate,
  onSearchChange,
  onCategoryChange,
  onDateChange,
  onClearFilters,
  hasActiveFilters,
}: EventFiltersProps) {
  return (
    <div className="my-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h3 className="text-lg font-semibold text-zinc-50 mb-4">
        Filter Events
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search by Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Search by Title
          </label>
          <Input
            type="text"
            placeholder="Search events..."
            value={searchTitle}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-white/10 border-white/20 text-zinc-50 placeholder:text-zinc-400"
          />
        </div>

        {/* Filter by Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Category
          </label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-zinc-50">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter by Date */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            From Date (and upcoming)
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-white/10 border-white/20 text-zinc-50"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="bg-white/10 border-white/20 text-zinc-50 hover:bg-white/20"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}