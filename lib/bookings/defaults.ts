import type {
  BookingLocationKind,
  BookingQuestionType,
  BookingQuestionVisibility,
} from "@/lib/constants/booking"

export const DEFAULT_BOOKING_AVAILABILITY_WINDOWS = [
  { dayOfWeek: 1, startMinute: 9 * 60, endMinute: 17 * 60, position: 0 },
  { dayOfWeek: 2, startMinute: 9 * 60, endMinute: 17 * 60, position: 0 },
  { dayOfWeek: 3, startMinute: 9 * 60, endMinute: 17 * 60, position: 0 },
  { dayOfWeek: 4, startMinute: 9 * 60, endMinute: 17 * 60, position: 0 },
  { dayOfWeek: 5, startMinute: 9 * 60, endMinute: 17 * 60, position: 0 },
] as const

export type DefaultBookingQuestion = {
  fieldKey: string
  label: string
  description: string | null
  inputType: BookingQuestionType
  visibility: BookingQuestionVisibility
  placeholder: string | null
  options: string[] | null
  isSystem: boolean
  position: number
}

export const DEFAULT_BOOKING_QUESTIONS: DefaultBookingQuestion[] = [
  {
    fieldKey: "name",
    label: "Your name",
    description: null,
    inputType: "short_text",
    visibility: "required",
    placeholder: "Name",
    options: null,
    isSystem: true,
    position: 0,
  },
  {
    fieldKey: "email",
    label: "Email address",
    description: null,
    inputType: "email",
    visibility: "required",
    placeholder: "Email",
    options: null,
    isSystem: true,
    position: 1,
  },
  {
    fieldKey: "phone",
    label: "Phone number",
    description: null,
    inputType: "phone",
    visibility: "hidden",
    placeholder: "Phone",
    options: null,
    isSystem: true,
    position: 2,
  },
  {
    fieldKey: "location",
    label: "Location",
    description: null,
    inputType: "location",
    visibility: "required",
    placeholder: null,
    options: null,
    isSystem: true,
    position: 3,
  },
  {
    fieldKey: "topic",
    label: "What is this meeting about?",
    description: null,
    inputType: "short_text",
    visibility: "optional",
    placeholder: "Short summary",
    options: null,
    isSystem: true,
    position: 4,
  },
  {
    fieldKey: "notes",
    label: "Additional notes",
    description: null,
    inputType: "long_text",
    visibility: "optional",
    placeholder: "Anything else we should know?",
    options: null,
    isSystem: true,
    position: 5,
  },
  {
    fieldKey: "guests",
    label: "Add guests",
    description: null,
    inputType: "multiple_emails",
    visibility: "hidden",
    placeholder: "guest@example.com",
    options: null,
    isSystem: true,
    position: 6,
  },
  {
    fieldKey: "reschedule_reason",
    label: "Reason for reschedule",
    description: null,
    inputType: "long_text",
    visibility: "hidden",
    placeholder: "Why are you rescheduling?",
    options: null,
    isSystem: true,
    position: 7,
  },
]

export type DefaultBookingLocation = {
  kind: BookingLocationKind
  label: string
  value: string | null
  appConnectionId: string | null
  metadata: Record<string, unknown> | null
  isDefault: boolean
  isActive: boolean
  position: number
}

export const DEFAULT_BOOKING_LOCATION: DefaultBookingLocation = {
  kind: "custom_link",
  label: "Custom link",
  value: null,
  appConnectionId: null,
  metadata: null,
  isDefault: true,
  isActive: true,
  position: 0,
}
