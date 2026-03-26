import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  customType,
  datetime,
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
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    role: mysqlEnum("role", roleValues).notNull().default("client"),
    isActive: boolean("isActive").notNull().default(true),
    twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
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
}

export const schema = {
  ...authSchema,
  ...appSchema,
}

export type DBSchema = typeof schema
