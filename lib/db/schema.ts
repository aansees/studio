import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  customType,
  datetime,
  foreignKey,
  index,
  int,
  longtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core"

import {
  BOOKING_APP_PROVIDERS,
  BOOKING_APP_STATUSES,
  BOOKING_EVENT_TYPE_CALENDAR_PURPOSES,
  BOOKING_EVENT_TYPE_STATUSES,
  BOOKING_LOCATION_KINDS,
  BOOKING_OVERRIDE_KINDS,
  BOOKING_QUESTION_TYPES,
  BOOKING_QUESTION_VISIBILITIES,
  BOOKING_SOURCES,
  BOOKING_STATUSES,
} from "@/lib/constants/booking"
import {
  NOTIFICATION_EVENTS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "@/lib/constants/domain"
import { USER_ROLES } from "@/lib/constants/rbac"

const roleValues = [...USER_ROLES] as [string, ...string[]]
const projectStatusValues = [...PROJECT_STATUSES] as [string, ...string[]]
const projectPriorityValues = [...PROJECT_PRIORITIES] as [string, ...string[]]
const taskStatusValues = [...TASK_STATUSES] as [string, ...string[]]
const taskPriorityValues = [...TASK_PRIORITIES] as [string, ...string[]]
const taskTypeValues = [...TASK_TYPES] as [string, ...string[]]
const notificationEventValues = [...NOTIFICATION_EVENTS] as [string, ...string[]]
const chatAttachmentKindValues = ["image", "audio"] as [string, ...string[]]
const bookingEventTypeStatusValues = [...BOOKING_EVENT_TYPE_STATUSES] as [
  string,
  ...string[],
]
const bookingStatusValues = [...BOOKING_STATUSES] as [string, ...string[]]
const bookingSourceValues = [...BOOKING_SOURCES] as [string, ...string[]]
const bookingLocationKindValues = [...BOOKING_LOCATION_KINDS] as [
  string,
  ...string[],
]
const bookingAppProviderValues = [...BOOKING_APP_PROVIDERS] as [
  string,
  ...string[],
]
const bookingAppStatusValues = [...BOOKING_APP_STATUSES] as [
  string,
  ...string[],
]
const bookingEventTypeCalendarPurposeValues = [
  ...BOOKING_EVENT_TYPE_CALENDAR_PURPOSES,
] as [string, ...string[]]
const bookingQuestionTypeValues = [...BOOKING_QUESTION_TYPES] as [
  string,
  ...string[],
]
const bookingQuestionVisibilityValues = [...BOOKING_QUESTION_VISIBILITIES] as [
  string,
  ...string[],
]
const bookingOverrideKindValues = [...BOOKING_OVERRIDE_KINDS] as [
  string,
  ...string[],
]

const longblob = customType<{
  data: Buffer
  driverData: Buffer
}>({
  dataType() {
    return "longblob"
  },
  fromDriver(value) {
    const rawValue = value as Buffer | Uint8Array | ArrayBuffer

    if (Buffer.isBuffer(rawValue)) {
      return rawValue
    }

    if (rawValue instanceof Uint8Array) {
      return Buffer.from(rawValue)
    }

    return Buffer.from(rawValue)
  },
  toDriver(value) {
    return value
  },
})

const jsonText = customType<{
  data: unknown
  driverData: string | Buffer | null
}>({
  dataType() {
    return "longtext"
  },
  fromDriver(value) {
    const rawValue = value as string | Buffer | null | undefined

    if (rawValue === null || typeof rawValue === "undefined") {
      return null
    }

    if (typeof rawValue === "string") {
      return JSON.parse(rawValue)
    }

    if (Buffer.isBuffer(rawValue)) {
      return JSON.parse(rawValue.toString("utf8"))
    }

    return rawValue
  },
  toDriver(value) {
    if (value === null || typeof value === "undefined") {
      return null
    }

    return JSON.stringify(value)
  },
})

export const user = mysqlTable(
  "user",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    username: varchar("username", { length: 191 }),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    bio: text("bio"),
    phone: varchar("phone", { length: 32 }),
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
    bookingPageTitle: varchar("bookingPageTitle", { length: 191 }),
    bookingPageDescription: text("bookingPageDescription"),
    bookingEnabled: boolean("bookingEnabled").notNull().default(true),
    role: mysqlEnum("role", roleValues).notNull().default("client"),
    isActive: boolean("isActive").notNull().default(true),
    twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    uniqueIndex("user_email_unique").on(table.email),
    uniqueIndex("user_username_unique").on(table.username),
  ],
)

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
    ipAddress: varchar("ipAddress", { length: 255 }),
    userAgent: text("userAgent"),
    userId: varchar("userId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_idx").on(table.userId),
  ],
)

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    accountId: varchar("accountId", { length: 255 }).notNull(),
    providerId: varchar("providerId", { length: 255 }).notNull(),
    userId: varchar("userId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    accessToken: longtext("accessToken"),
    refreshToken: longtext("refreshToken"),
    idToken: longtext("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("account_user_idx").on(table.userId),
    uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
  ],
)

export const verification = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    identifier: varchar("identifier", { length: 191 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

export const twoFactor = mysqlTable(
  "twoFactor",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    secret: varchar("secret", { length: 512 }).notNull(),
    backupCodes: text("backupCodes").notNull(),
    userId: varchar("userId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    uniqueIndex("two_factor_user_unique").on(table.userId),
    index("two_factor_user_idx").on(table.userId),
  ],
)

export const passkey = mysqlTable(
  "passkey",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    name: varchar("name", { length: 191 }),
    publicKey: longtext("publicKey").notNull(),
    userId: varchar("userId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    credentialID: varchar("credentialID", { length: 512 }).notNull(),
    counter: int("counter").notNull().default(0),
    deviceType: varchar("deviceType", { length: 64 }).notNull(),
    backedUp: boolean("backedUp").notNull().default(false),
    transports: varchar("transports", { length: 255 }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
    aaguid: varchar("aaguid", { length: 191 }),
  },
  (table) => [
    index("passkey_user_idx").on(table.userId),
    uniqueIndex("passkey_credential_unique").on(table.credentialID),
  ],
)

export const project = mysqlTable(
  "project",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    slug: varchar("slug", { length: 191 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", projectStatusValues).notNull().default("draft"),
    priority: mysqlEnum("priority", projectPriorityValues).notNull().default("medium"),
    startDate: datetime("startDate", { mode: "date" }),
    endDate: datetime("endDate", { mode: "date" }),
    completedAt: datetime("completedAt", { mode: "date" }),
    projectLeadId: varchar("projectLeadId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
    clientId: varchar("clientId", { length: 191 }).references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    progressPercent: int("progressPercent").notNull().default(0),
    notes: longtext("notes"),
    devLinks: longtext("devLinks"),
    credentials: longtext("credentials"),
    createdById: varchar("createdById", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    uniqueIndex("project_slug_unique").on(table.slug),
    index("project_lead_idx").on(table.projectLeadId),
    index("project_client_idx").on(table.clientId),
    index("project_status_idx").on(table.status),
  ],
)

export const projectMember = mysqlTable(
  "projectMember",
  {
    projectId: varchar("projectId", { length: 191 })
      .notNull()
      .references(() => project.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: varchar("userId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    role: mysqlEnum("role", roleValues).notNull().default("developer"),
    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId] }),
    index("project_member_user_idx").on(table.userId),
  ],
)

export const task = mysqlTable(
  "task",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    projectId: varchar("projectId", { length: 191 })
      .notNull()
      .references(() => project.id, { onDelete: "cascade", onUpdate: "cascade" }),
    title: varchar("title", { length: 191 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", taskTypeValues).notNull().default("feature"),
    priority: mysqlEnum("priority", taskPriorityValues).notNull().default("medium"),
    status: mysqlEnum("status", taskStatusValues).notNull().default("todo"),
    assigneeId: varchar("assigneeId", { length: 191 }).references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdById: varchar("createdById", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
    dueDate: datetime("dueDate", { mode: "date" }),
    startedAt: datetime("startedAt", { mode: "date" }),
    completedAt: datetime("completedAt", { mode: "date" }),
    estimatedHours: int("estimatedHours"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("task_project_idx").on(table.projectId),
    index("task_assignee_idx").on(table.assigneeId),
    index("task_status_idx").on(table.status),
  ],
)

export const taskAssignment = mysqlTable(
  "taskAssignment",
  {
    taskId: varchar("taskId", { length: 191 })
      .notNull()
      .references(() => task.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: varchar("userId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    assignedAt: timestamp("assignedAt").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.userId] }),
    index("task_assignment_task_idx").on(table.taskId),
    index("task_assignment_user_idx").on(table.userId),
  ],
)

export const taskComment = mysqlTable(
  "taskComment",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    taskId: varchar("taskId", { length: 191 })
      .notNull()
      .references(() => task.id, { onDelete: "cascade", onUpdate: "cascade" }),
    authorId: varchar("authorId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("task_comment_task_idx").on(table.taskId),
    index("task_comment_author_idx").on(table.authorId),
  ],
)

export const taskChatMessage = mysqlTable(
  "taskChatMessage",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    roomId: varchar("roomId", { length: 191 }).notNull(),
    taskId: varchar("taskId", { length: 191 })
      .notNull()
      .references(() => task.id, { onDelete: "cascade", onUpdate: "cascade" }),
    senderId: varchar("senderId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
    senderRole: mysqlEnum("senderRole", roleValues).notNull(),
    displayName: varchar("displayName", { length: 191 }).notNull(),
    text: text("text").notNull(),
    replyToMessageId: varchar("replyToMessageId", { length: 191 }),
    reactions: jsonText("reactions").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("task_chat_room_idx").on(table.roomId),
    index("task_chat_task_idx").on(table.taskId),
    index("task_chat_sender_idx").on(table.senderId),
  ],
)

export const taskChatAttachment = mysqlTable(
  "taskChatAttachment",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    messageId: varchar("messageId", { length: 191 })
      .notNull()
      .references(() => taskChatMessage.id, { onDelete: "cascade", onUpdate: "cascade" }),
    taskId: varchar("taskId", { length: 191 })
      .notNull()
      .references(() => task.id, { onDelete: "cascade", onUpdate: "cascade" }),
    kind: mysqlEnum("kind", chatAttachmentKindValues).notNull(),
    fileName: varchar("fileName", { length: 191 }),
    mimeType: varchar("mimeType", { length: 191 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    durationMs: int("durationMs"),
    width: int("width"),
    height: int("height"),
    storageKey: varchar("storageKey", { length: 191 }).notNull(),
    binary: longblob("binary").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("task_chat_attachment_message_idx").on(table.messageId),
    index("task_chat_attachment_task_idx").on(table.taskId),
    index("task_chat_attachment_storage_idx").on(table.storageKey),
  ],
)

export const projectChatMessage = mysqlTable(
  "projectChatMessage",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    roomId: varchar("roomId", { length: 191 }).notNull(),
    projectId: varchar("projectId", { length: 191 })
      .notNull()
      .references(() => project.id, { onDelete: "cascade", onUpdate: "cascade" }),
    senderId: varchar("senderId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
    senderRole: mysqlEnum("senderRole", roleValues).notNull(),
    displayName: varchar("displayName", { length: 191 }).notNull(),
    text: text("text").notNull(),
    replyToMessageId: varchar("replyToMessageId", { length: 191 }),
    createdAtMs: bigint("createdAtMs", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("project_chat_room_idx").on(table.roomId),
    index("project_chat_project_idx").on(table.projectId),
    index("project_chat_sender_idx").on(table.senderId),
    index("project_chat_created_at_ms_idx").on(table.createdAtMs),
  ],
)

export const notification = mysqlTable(
  "notification",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    userId: varchar("userId", { length: 191 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    event: mysqlEnum("event", notificationEventValues).notNull(),
    title: varchar("title", { length: 191 }).notNull(),
    body: text("body"),
    metadata: jsonText("metadata").$type<Record<string, unknown> | null>(),
    readAt: datetime("readAt", { mode: "date" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("notification_user_idx").on(table.userId),
    index("notification_event_idx").on(table.event),
  ],
)

export const bookingAvailabilitySchedule = mysqlTable(
  "bookingAvailabilitySchedule",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    userId: varchar("userId", { length: 191 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
    isDefault: boolean("isDefault").notNull().default(false),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "bas_user_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("booking_availability_schedule_user_idx").on(table.userId),
    uniqueIndex("booking_availability_schedule_user_name_unique").on(
      table.userId,
      table.name,
    ),
  ],
)

export const bookingAvailabilityWindow = mysqlTable(
  "bookingAvailabilityWindow",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    scheduleId: varchar("scheduleId", { length: 191 }).notNull(),
    dayOfWeek: int("dayOfWeek").notNull(),
    startMinute: int("startMinute").notNull(),
    endMinute: int("endMinute").notNull(),
    position: int("position").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.scheduleId],
      foreignColumns: [bookingAvailabilitySchedule.id],
      name: "baw_schedule_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("booking_availability_window_schedule_idx").on(table.scheduleId),
    index("booking_availability_window_day_idx").on(table.scheduleId, table.dayOfWeek),
  ],
)

export const bookingAvailabilityOverride = mysqlTable(
  "bookingAvailabilityOverride",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    scheduleId: varchar("scheduleId", { length: 191 }).notNull(),
    date: datetime("date", { mode: "date" }).notNull(),
    kind: mysqlEnum("kind", bookingOverrideKindValues).notNull().default("unavailable"),
    startMinute: int("startMinute"),
    endMinute: int("endMinute"),
    reason: varchar("reason", { length: 191 }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.scheduleId],
      foreignColumns: [bookingAvailabilitySchedule.id],
      name: "bao_schedule_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("booking_availability_override_schedule_idx").on(table.scheduleId),
    index("booking_availability_override_date_idx").on(table.scheduleId, table.date),
  ],
)

export const bookingAppConnection = mysqlTable(
  "bookingAppConnection",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    userId: varchar("userId", { length: 191 }).notNull(),
    provider: mysqlEnum("provider", bookingAppProviderValues).notNull(),
    status: mysqlEnum("status", bookingAppStatusValues).notNull().default("connected"),
    accountEmail: varchar("accountEmail", { length: 191 }),
    accountLabel: varchar("accountLabel", { length: 191 }).notNull(),
    externalAccountId: varchar("externalAccountId", { length: 255 }).notNull(),
    externalCalendarId: varchar("externalCalendarId", { length: 255 }),
    externalCalendarName: varchar("externalCalendarName", { length: 191 }),
    scopes: text("scopes"),
    accessToken: longtext("accessToken"),
    refreshToken: longtext("refreshToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    metadata: jsonText("metadata").$type<Record<string, unknown> | null>(),
    supportsCalendar: boolean("supportsCalendar").notNull().default(false),
    supportsConferencing: boolean("supportsConferencing").notNull().default(false),
    canCheckConflicts: boolean("canCheckConflicts").notNull().default(false),
    canCreateEvents: boolean("canCreateEvents").notNull().default(false),
    lastSyncedAt: datetime("lastSyncedAt", { mode: "date" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "bac_user_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("booking_app_connection_user_idx").on(table.userId),
    index("booking_app_connection_provider_idx").on(table.provider),
    uniqueIndex("booking_app_connection_account_unique").on(
      table.userId,
      table.provider,
      table.externalAccountId,
    ),
  ],
)

export const bookingEventType = mysqlTable(
  "bookingEventType",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    userId: varchar("userId", { length: 191 }).notNull(),
    availabilityScheduleId: varchar("availabilityScheduleId", { length: 191 }),
    title: varchar("title", { length: 191 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", bookingEventTypeStatusValues).notNull().default("draft"),
    durationMinutes: int("durationMinutes").notNull().default(30),
    allowMultipleDurations: boolean("allowMultipleDurations").notNull().default(false),
    durationOptions: jsonText("durationOptions").$type<number[] | null>(),
    color: varchar("color", { length: 32 }),
    bookingNoticeMinutes: int("bookingNoticeMinutes").notNull().default(0),
    bookingWindowDays: int("bookingWindowDays").notNull().default(90),
    bufferBeforeMinutes: int("bufferBeforeMinutes").notNull().default(0),
    bufferAfterMinutes: int("bufferAfterMinutes").notNull().default(0),
    maxBookingsPerDay: int("maxBookingsPerDay"),
    requireEmailVerification: boolean("requireEmailVerification").notNull().default(false),
    allowGuestBookings: boolean("allowGuestBookings").notNull().default(true),
    requireLogin: boolean("requireLogin").notNull().default(false),
    allowCancellation: boolean("allowCancellation").notNull().default(true),
    allowReschedule: boolean("allowReschedule").notNull().default(true),
    isPublic: boolean("isPublic").notNull().default(true),
    confirmationChannels: jsonText("confirmationChannels").$type<string[] | null>(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "bet_user_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.availabilityScheduleId],
      foreignColumns: [bookingAvailabilitySchedule.id],
      name: "bet_schedule_fk",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    index("booking_event_type_user_idx").on(table.userId),
    index("booking_event_type_schedule_idx").on(table.availabilityScheduleId),
    uniqueIndex("booking_event_type_user_slug_unique").on(table.userId, table.slug),
  ],
)

export const bookingEventTypeLocation = mysqlTable(
  "bookingEventTypeLocation",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    eventTypeId: varchar("eventTypeId", { length: 191 }).notNull(),
    appConnectionId: varchar("appConnectionId", { length: 191 }),
    kind: mysqlEnum("kind", bookingLocationKindValues).notNull(),
    label: varchar("label", { length: 191 }).notNull(),
    value: text("value"),
    metadata: jsonText("metadata").$type<Record<string, unknown> | null>(),
    isDefault: boolean("isDefault").notNull().default(false),
    isActive: boolean("isActive").notNull().default(true),
    position: int("position").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.eventTypeId],
      foreignColumns: [bookingEventType.id],
      name: "betl_event_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.appConnectionId],
      foreignColumns: [bookingAppConnection.id],
      name: "betl_app_fk",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    index("booking_event_type_location_event_idx").on(table.eventTypeId),
    index("booking_event_type_location_connection_idx").on(table.appConnectionId),
  ],
)

export const bookingEventTypeCalendar = mysqlTable(
  "bookingEventTypeCalendar",
  {
    eventTypeId: varchar("eventTypeId", { length: 191 }).notNull(),
    appConnectionId: varchar("appConnectionId", { length: 191 }).notNull(),
    purpose: mysqlEnum("purpose", bookingEventTypeCalendarPurposeValues)
      .notNull()
      .default("conflict"),
    isPrimary: boolean("isPrimary").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.eventTypeId],
      foreignColumns: [bookingEventType.id],
      name: "betc_event_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.appConnectionId],
      foreignColumns: [bookingAppConnection.id],
      name: "betc_app_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    primaryKey({
      columns: [table.eventTypeId, table.appConnectionId, table.purpose],
    }),
    index("booking_event_type_calendar_connection_idx").on(table.appConnectionId),
  ],
)

export const bookingEventTypeQuestion = mysqlTable(
  "bookingEventTypeQuestion",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    eventTypeId: varchar("eventTypeId", { length: 191 }).notNull(),
    fieldKey: varchar("fieldKey", { length: 64 }).notNull(),
    label: varchar("label", { length: 191 }).notNull(),
    description: text("description"),
    inputType: mysqlEnum("inputType", bookingQuestionTypeValues).notNull(),
    visibility: mysqlEnum("visibility", bookingQuestionVisibilityValues)
      .notNull()
      .default("optional"),
    placeholder: varchar("placeholder", { length: 191 }),
    options: jsonText("options").$type<string[] | null>(),
    isSystem: boolean("isSystem").notNull().default(false),
    position: int("position").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.eventTypeId],
      foreignColumns: [bookingEventType.id],
      name: "betq_event_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("booking_event_type_question_event_idx").on(table.eventTypeId),
    uniqueIndex("booking_event_type_question_key_unique").on(
      table.eventTypeId,
      table.fieldKey,
    ),
  ],
)

export const booking = mysqlTable(
  "booking",
  {
    id: varchar("id", { length: 191 }).primaryKey().$defaultFn(crypto.randomUUID),
    ownerUserId: varchar("ownerUserId", { length: 191 }).notNull(),
    eventTypeId: varchar("eventTypeId", { length: 191 }).notNull(),
    attendeeUserId: varchar("attendeeUserId", { length: 191 }),
    createdByUserId: varchar("createdByUserId", { length: 191 }),
    appConnectionId: varchar("appConnectionId", { length: 191 }),
    source: mysqlEnum("source", bookingSourceValues).notNull().default("guest"),
    status: mysqlEnum("status", bookingStatusValues).notNull().default("pending"),
    title: varchar("title", { length: 191 }).notNull(),
    attendeeName: varchar("attendeeName", { length: 191 }).notNull(),
    attendeeEmail: varchar("attendeeEmail", { length: 191 }).notNull(),
    attendeePhone: varchar("attendeePhone", { length: 64 }),
    attendeeTimezone: varchar("attendeeTimezone", { length: 64 }),
    locationKind: mysqlEnum("locationKind", bookingLocationKindValues),
    locationLabel: varchar("locationLabel", { length: 191 }),
    locationValue: text("locationValue"),
    meetingUrl: text("meetingUrl"),
    answers: jsonText("answers").$type<Record<string, unknown> | null>(),
    guests: jsonText("guests").$type<string[] | null>(),
    internalNotes: text("internalNotes"),
    cancellationReason: text("cancellationReason"),
    rescheduleReason: text("rescheduleReason"),
    startsAt: datetime("startsAt", { mode: "date" }).notNull(),
    endsAt: datetime("endsAt", { mode: "date" }).notNull(),
    confirmedAt: datetime("confirmedAt", { mode: "date" }),
    cancelledAt: datetime("cancelledAt", { mode: "date" }),
    completedAt: datetime("completedAt", { mode: "date" }),
    externalCalendarEventId: varchar("externalCalendarEventId", { length: 255 }),
    externalMeetingId: varchar("externalMeetingId", { length: 255 }),
    manageToken: varchar("manageToken", { length: 191 }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerUserId],
      foreignColumns: [user.id],
      name: "booking_owner_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.eventTypeId],
      foreignColumns: [bookingEventType.id],
      name: "booking_event_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.attendeeUserId],
      foreignColumns: [user.id],
      name: "booking_attendee_fk",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.createdByUserId],
      foreignColumns: [user.id],
      name: "booking_creator_fk",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.appConnectionId],
      foreignColumns: [bookingAppConnection.id],
      name: "booking_app_fk",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    index("booking_owner_idx").on(table.ownerUserId),
    index("booking_event_type_idx").on(table.eventTypeId),
    index("booking_attendee_idx").on(table.attendeeUserId),
    index("booking_status_idx").on(table.status),
    index("booking_starts_at_idx").on(table.startsAt),
    uniqueIndex("booking_manage_token_unique").on(table.manageToken),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  ownedProjects: many(project, { relationName: "projectCreatedBy" }),
  ledProjects: many(project, { relationName: "projectLead" }),
  tasksAssigned: many(task, { relationName: "taskAssignee" }),
  taskAssignments: many(taskAssignment),
  tasksCreated: many(task, { relationName: "taskCreator" }),
  projectMemberships: many(projectMember),
  projectChatMessages: many(projectChatMessage),
  bookingAvailabilitySchedules: many(bookingAvailabilitySchedule),
  bookingAppConnections: many(bookingAppConnection),
  bookingEventTypes: many(bookingEventType),
  bookingsOwned: many(booking, { relationName: "bookingOwner" }),
  bookingsAttending: many(booking, { relationName: "bookingAttendee" }),
  bookingsCreated: many(booking, { relationName: "bookingCreator" }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const projectRelations = relations(project, ({ one, many }) => ({
  lead: one(user, {
    fields: [project.projectLeadId],
    references: [user.id],
    relationName: "projectLead",
  }),
  client: one(user, {
    fields: [project.clientId],
    references: [user.id],
  }),
  createdBy: one(user, {
    fields: [project.createdById],
    references: [user.id],
    relationName: "projectCreatedBy",
  }),
  members: many(projectMember),
  tasks: many(task),
  chatMessages: many(projectChatMessage),
}))

export const projectMemberRelations = relations(projectMember, ({ one }) => ({
  project: one(project, {
    fields: [projectMember.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMember.userId],
    references: [user.id],
  }),
}))

export const taskRelations = relations(task, ({ one, many }) => ({
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  assignee: one(user, {
    fields: [task.assigneeId],
    references: [user.id],
    relationName: "taskAssignee",
  }),
  createdBy: one(user, {
    fields: [task.createdById],
    references: [user.id],
    relationName: "taskCreator",
  }),
  assignments: many(taskAssignment),
  comments: many(taskComment),
  chatMessages: many(taskChatMessage),
}))

export const taskAssignmentRelations = relations(taskAssignment, ({ one }) => ({
  task: one(task, {
    fields: [taskAssignment.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskAssignment.userId],
    references: [user.id],
  }),
}))

export const taskCommentRelations = relations(taskComment, ({ one }) => ({
  task: one(task, {
    fields: [taskComment.taskId],
    references: [task.id],
  }),
  author: one(user, {
    fields: [taskComment.authorId],
    references: [user.id],
  }),
}))

export const taskChatMessageRelations = relations(taskChatMessage, ({ one, many }) => ({
  task: one(task, {
    fields: [taskChatMessage.taskId],
    references: [task.id],
  }),
  sender: one(user, {
    fields: [taskChatMessage.senderId],
    references: [user.id],
  }),
  attachments: many(taskChatAttachment),
}))

export const taskChatAttachmentRelations = relations(taskChatAttachment, ({ one }) => ({
  message: one(taskChatMessage, {
    fields: [taskChatAttachment.messageId],
    references: [taskChatMessage.id],
  }),
  task: one(task, {
    fields: [taskChatAttachment.taskId],
    references: [task.id],
  }),
}))

export const projectChatMessageRelations = relations(projectChatMessage, ({ one }) => ({
  project: one(project, {
    fields: [projectChatMessage.projectId],
    references: [project.id],
  }),
  sender: one(user, {
    fields: [projectChatMessage.senderId],
    references: [user.id],
  }),
}))

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}))

export const bookingAvailabilityScheduleRelations = relations(
  bookingAvailabilitySchedule,
  ({ one, many }) => ({
    user: one(user, {
      fields: [bookingAvailabilitySchedule.userId],
      references: [user.id],
    }),
    windows: many(bookingAvailabilityWindow),
    overrides: many(bookingAvailabilityOverride),
    eventTypes: many(bookingEventType),
  }),
)

export const bookingAvailabilityWindowRelations = relations(
  bookingAvailabilityWindow,
  ({ one }) => ({
    schedule: one(bookingAvailabilitySchedule, {
      fields: [bookingAvailabilityWindow.scheduleId],
      references: [bookingAvailabilitySchedule.id],
    }),
  }),
)

export const bookingAvailabilityOverrideRelations = relations(
  bookingAvailabilityOverride,
  ({ one }) => ({
    schedule: one(bookingAvailabilitySchedule, {
      fields: [bookingAvailabilityOverride.scheduleId],
      references: [bookingAvailabilitySchedule.id],
    }),
  }),
)

export const bookingAppConnectionRelations = relations(
  bookingAppConnection,
  ({ one, many }) => ({
    user: one(user, {
      fields: [bookingAppConnection.userId],
      references: [user.id],
    }),
    eventTypeLocations: many(bookingEventTypeLocation),
    eventTypeCalendars: many(bookingEventTypeCalendar),
    bookings: many(booking),
  }),
)

export const bookingEventTypeRelations = relations(
  bookingEventType,
  ({ one, many }) => ({
    user: one(user, {
      fields: [bookingEventType.userId],
      references: [user.id],
    }),
    availabilitySchedule: one(bookingAvailabilitySchedule, {
      fields: [bookingEventType.availabilityScheduleId],
      references: [bookingAvailabilitySchedule.id],
    }),
    locations: many(bookingEventTypeLocation),
    calendars: many(bookingEventTypeCalendar),
    questions: many(bookingEventTypeQuestion),
    bookings: many(booking),
  }),
)

export const bookingEventTypeLocationRelations = relations(
  bookingEventTypeLocation,
  ({ one }) => ({
    eventType: one(bookingEventType, {
      fields: [bookingEventTypeLocation.eventTypeId],
      references: [bookingEventType.id],
    }),
    appConnection: one(bookingAppConnection, {
      fields: [bookingEventTypeLocation.appConnectionId],
      references: [bookingAppConnection.id],
    }),
  }),
)

export const bookingEventTypeCalendarRelations = relations(
  bookingEventTypeCalendar,
  ({ one }) => ({
    eventType: one(bookingEventType, {
      fields: [bookingEventTypeCalendar.eventTypeId],
      references: [bookingEventType.id],
    }),
    appConnection: one(bookingAppConnection, {
      fields: [bookingEventTypeCalendar.appConnectionId],
      references: [bookingAppConnection.id],
    }),
  }),
)

export const bookingEventTypeQuestionRelations = relations(
  bookingEventTypeQuestion,
  ({ one }) => ({
    eventType: one(bookingEventType, {
      fields: [bookingEventTypeQuestion.eventTypeId],
      references: [bookingEventType.id],
    }),
  }),
)

export const bookingRelations = relations(booking, ({ one }) => ({
  owner: one(user, {
    fields: [booking.ownerUserId],
    references: [user.id],
    relationName: "bookingOwner",
  }),
  attendee: one(user, {
    fields: [booking.attendeeUserId],
    references: [user.id],
    relationName: "bookingAttendee",
  }),
  createdBy: one(user, {
    fields: [booking.createdByUserId],
    references: [user.id],
    relationName: "bookingCreator",
  }),
  eventType: one(bookingEventType, {
    fields: [booking.eventTypeId],
    references: [bookingEventType.id],
  }),
  appConnection: one(bookingAppConnection, {
    fields: [booking.appConnectionId],
    references: [bookingAppConnection.id],
  }),
}))

export const authSchema = {
  user,
  session,
  account,
  verification,
  twoFactor,
  passkey,
}

export const appSchema = {
  project,
  projectMember,
  task,
  taskAssignment,
  taskComment,
  taskChatMessage,
  taskChatAttachment,
  projectChatMessage,
  notification,
  bookingAvailabilitySchedule,
  bookingAvailabilityWindow,
  bookingAvailabilityOverride,
  bookingAppConnection,
  bookingEventType,
  bookingEventTypeLocation,
  bookingEventTypeCalendar,
  bookingEventTypeQuestion,
  booking,
}

export const schema = {
  ...authSchema,
  ...appSchema,
}

export type DBSchema = typeof schema
