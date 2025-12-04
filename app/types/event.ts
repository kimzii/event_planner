export interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location?: string;
  event_date: string;
  created_at: string;
}