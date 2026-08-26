import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  organization: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const SponsorSchema = z.object({
  id: z.string().uuid().optional(),
  sponsor_name: z.string().min(2, "Sponsor name is required"),
  sponsor_tier: z.enum([
    "principal", "platinum", "gold", "lunch", "silver", "bronze", "custom", "other",
    "Principal", "Platinum", "Gold", "Lunch", "Silver", "Bronze", "Other"
  ]),
  sponsorship_amount: z.coerce.number().min(0, "Amount must be a positive number"),
  payment_status: z.enum(["pending", "partial", "paid", "Payment Received", "-", "Pending", "Paid"]),
  lead_status: z.enum(["prospect", "contacted", "meeting_scheduled", "proposal_sent", "negotiation", "confirmed", "rejected"]),
  contact_person: z.string().min(2, "Contact person is required"),
  email: z.string().email("Please enter a valid email address").or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  version: z.coerce.number().optional(),
  change_reason: z.string().optional(),
});

export const GuestSchema = z.object({
  id: z.string().uuid().optional(),
  sponsor_id: z.string().uuid().nullable().optional(),
  guest_name: z.string().min(2, "Guest name is required"),
  designation: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email("Please enter a valid email").or(z.literal("")),
  phone: z.string().optional(),
  attendance_status: z.enum(["invited", "confirmed", "declined", "attended", "Pending", "Confirmed", "Not"]),
  guest_role: z.enum(["vip", "sponsor", "judge", "faculty", "media", "volunteer", "team_member"]),
  arrival_date: z.string().nullable().optional(),
  departure_date: z.string().nullable().optional(),
  accommodation_required: z.boolean().default(false),
  remarks: z.string().optional(),
  version: z.coerce.number().optional(),
  change_reason: z.string().optional(),
});

export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  deadline: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "completed"]),
  version: z.coerce.number().optional(),
  change_reason: z.string().optional(),
});

export const InteractionSchema = z.object({
  sponsor_id: z.string().uuid(),
  type: z.enum(["call", "meeting", "email", "whatsapp", "follow_up", "proposal_sent", "payment_reminder"]),
  summary: z.string().min(3, "Summary must be at least 3 characters"),
  details: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type SponsorInput = z.infer<typeof SponsorSchema>;
export type GuestInput = z.infer<typeof GuestSchema>;
export type TaskInput = z.infer<typeof TaskSchema>;
export type InteractionInput = z.infer<typeof InteractionSchema>;
