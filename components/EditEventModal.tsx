"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";
import { Event } from "../app/types/event";
import { Upload } from "lucide-react";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  event: Event | null;
}

const CATEGORIES = [
  "Conference",
  "Workshop",
  "Meetup",
  "Social",
  "Sports",
  "Music",
];

export default function EditEventModal({
  isOpen,
  onClose,
  onEventUpdated,
  event,
}: EditEventModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    time_from: "",
    time_to: "",
    location: "",
    category: "",
  });

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        event_date: event.event_date || "",
        time_from: event.time_from || "",
        time_to: event.time_to || "",
        location: event.location || "",
        category: event.category || "",
      });
      setImagePreview(event.image_url || null);
    }
  }, [event]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
      return null;
    }
  };

  const deleteOldImage = async (imageUrl: string) => {
    try {
      const imagePath = imageUrl.split("/").pop();
      if (imagePath) {
        await supabase.storage.from("event-images").remove([imagePath]);
      }
    } catch (error) {
      console.error("Error deleting old image:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setLoading(true);

    try {
      let imageUrl = event.image_url;

      // Upload new image if selected
      if (imageFile) {
        toast.loading("Uploading image...");
        const newImageUrl = await uploadImage(imageFile);
        toast.dismiss();

        if (!newImageUrl) {
          return;
        }

        // Delete old image if exists
        if (event.image_url) {
          await deleteOldImage(event.image_url);
        }

        imageUrl = newImageUrl;
      }

      const { error } = await supabase
        .from("events")
        .update({
          ...formData,
          image_url: imageUrl,
        })
        .eq("id", event.id)
        .eq("user_id", session?.user?.id); // Security check

      if (error) throw error;

      onEventUpdated();
      onClose();

      toast.success("Event updated successfully!", {
        description: `"${formData.title}" has been updated.`,
      });
    } catch (error: unknown) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
      setImageFile(null);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update the details of your event below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Event Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(event.image_url || null);
                  }}
                >
                  Reset
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <Label
                  htmlFor="image"
                  className="cursor-pointer text-sm text-muted-foreground"
                >
                  Click to upload or drag and drop
                  <br />
                  <span className="text-xs">PNG, JPG up to 10MB</span>
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter event title"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="event_date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event_date"
                type="date"
                required
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
              />
            </div>

            {/* Time From */}
            <div className="space-y-2">
              <Label htmlFor="time_from">
                Time From <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time_from"
                type="time"
                required
                value={formData.time_from}
                onChange={(e) =>
                  setFormData({ ...formData, time_from: e.target.value })
                }
              />
            </div>

            {/* Time To */}
            <div className="space-y-2">
              <Label htmlFor="time_to">
                Time To <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time_to"
                type="time"
                required
                value={formData.time_to}
                onChange={(e) =>
                  setFormData({ ...formData, time_to: e.target.value })
                }
              />
            </div>

            {/* Location */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Enter event location"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter event description"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
