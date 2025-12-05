export interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location?: string;
  event_date: string;
  time_from?: string;
  time_to?: string;
  image_url?: string;
  category?: string;
  created_at: string;
}