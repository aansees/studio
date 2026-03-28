CREATE TABLE `account` (
	`id` varchar(191) NOT NULL,
	`accountId` varchar(255) NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`accessToken` longtext,
	`refreshToken` longtext,
	`idToken` longtext,
	`accessTokenExpiresAt` timestamp,
	`refreshTokenExpiresAt` timestamp,
	`scope` text,
	`password` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_provider_account_unique` UNIQUE(`providerId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `booking` (
	`id` varchar(191) NOT NULL,
	`ownerUserId` varchar(191) NOT NULL,
	`eventTypeId` varchar(191) NOT NULL,
	`attendeeUserId` varchar(191),
	`createdByUserId` varchar(191),
	`appConnectionId` varchar(191),
	`source` enum('authenticated','guest','admin') NOT NULL DEFAULT 'guest',
	`status` enum('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending',
	`title` varchar(191) NOT NULL,
	`attendeeName` varchar(191) NOT NULL,
	`attendeeEmail` varchar(191) NOT NULL,
	`attendeePhone` varchar(64),
	`attendeeTimezone` varchar(64),
	`locationKind` enum('google_meet','zoom','in_person','phone','custom_link','custom_address'),
	`locationLabel` varchar(191),
	`locationValue` text,
	`meetingUrl` text,
	`answers` longtext,
	`guests` longtext,
	`internalNotes` text,
	`cancellationReason` text,
	`rescheduleReason` text,
	`startsAt` datetime NOT NULL,
	`endsAt` datetime NOT NULL,
	`confirmedAt` datetime,
	`cancelledAt` datetime,
	`completedAt` datetime,
	`externalCalendarEventId` varchar(255),
	`externalMeetingId` varchar(255),
	`manageToken` varchar(191),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_manage_token_unique` UNIQUE(`manageToken`)
);
--> statement-breakpoint
CREATE TABLE `bookingAppConnection` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`provider` enum('google_calendar','outlook_calendar','zoom') NOT NULL,
	`status` enum('connected','expired','error','revoked') NOT NULL DEFAULT 'connected',
	`accountEmail` varchar(191),
	`accountLabel` varchar(191) NOT NULL,
	`externalAccountId` varchar(255) NOT NULL,
	`externalCalendarId` varchar(255),
	`externalCalendarName` varchar(191),
	`scopes` text,
	`accessToken` longtext,
	`refreshToken` longtext,
	`accessTokenExpiresAt` timestamp,
	`refreshTokenExpiresAt` timestamp,
	`metadata` longtext,
	`supportsCalendar` boolean NOT NULL DEFAULT false,
	`supportsConferencing` boolean NOT NULL DEFAULT false,
	`canCheckConflicts` boolean NOT NULL DEFAULT false,
	`canCreateEvents` boolean NOT NULL DEFAULT false,
	`lastSyncedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingAppConnection_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_app_connection_account_unique` UNIQUE(`userId`,`provider`,`externalAccountId`)
);
--> statement-breakpoint
CREATE TABLE `bookingAvailabilityOverride` (
	`id` varchar(191) NOT NULL,
	`scheduleId` varchar(191) NOT NULL,
	`date` datetime NOT NULL,
	`kind` enum('available','unavailable') NOT NULL DEFAULT 'unavailable',
	`startMinute` int,
	`endMinute` int,
	`reason` varchar(191),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingAvailabilityOverride_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookingAvailabilitySchedule` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingAvailabilitySchedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_availability_schedule_user_name_unique` UNIQUE(`userId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `bookingAvailabilityWindow` (
	`id` varchar(191) NOT NULL,
	`scheduleId` varchar(191) NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startMinute` int NOT NULL,
	`endMinute` int NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookingAvailabilityWindow_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookingEventType` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`availabilityScheduleId` varchar(191),
	`title` varchar(191) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`description` text,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`durationMinutes` int NOT NULL DEFAULT 30,
	`allowMultipleDurations` boolean NOT NULL DEFAULT false,
	`durationOptions` longtext,
	`color` varchar(32),
	`bookingNoticeMinutes` int NOT NULL DEFAULT 0,
	`bookingWindowDays` int NOT NULL DEFAULT 90,
	`bufferBeforeMinutes` int NOT NULL DEFAULT 0,
	`bufferAfterMinutes` int NOT NULL DEFAULT 0,
	`maxBookingsPerDay` int,
	`requireEmailVerification` boolean NOT NULL DEFAULT false,
	`allowGuestBookings` boolean NOT NULL DEFAULT true,
	`requireLogin` boolean NOT NULL DEFAULT false,
	`allowCancellation` boolean NOT NULL DEFAULT true,
	`allowReschedule` boolean NOT NULL DEFAULT true,
	`isPublic` boolean NOT NULL DEFAULT true,
	`confirmationChannels` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingEventType_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_event_type_user_slug_unique` UNIQUE(`userId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `bookingEventTypeCalendar` (
	`eventTypeId` varchar(191) NOT NULL,
	`appConnectionId` varchar(191) NOT NULL,
	`purpose` enum('destination','conflict') NOT NULL DEFAULT 'conflict',
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookingEventTypeCalendar_eventTypeId_appConnectionId_purpose_pk` PRIMARY KEY(`eventTypeId`,`appConnectionId`,`purpose`)
);
--> statement-breakpoint
CREATE TABLE `bookingEventTypeLocation` (
	`id` varchar(191) NOT NULL,
	`eventTypeId` varchar(191) NOT NULL,
	`appConnectionId` varchar(191),
	`kind` enum('google_meet','zoom','in_person','phone','custom_link','custom_address') NOT NULL,
	`label` varchar(191) NOT NULL,
	`value` text,
	`metadata` longtext,
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingEventTypeLocation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookingEventTypeQuestion` (
	`id` varchar(191) NOT NULL,
	`eventTypeId` varchar(191) NOT NULL,
	`fieldKey` varchar(64) NOT NULL,
	`label` varchar(191) NOT NULL,
	`description` text,
	`inputType` enum('short_text','long_text','email','phone','multiple_emails','select','location') NOT NULL,
	`visibility` enum('hidden','optional','required') NOT NULL DEFAULT 'optional',
	`placeholder` varchar(191),
	`options` longtext,
	`isSystem` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingEventTypeQuestion_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_event_type_question_key_unique` UNIQUE(`eventTypeId`,`fieldKey`)
);
--> statement-breakpoint
CREATE TABLE `notification` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`event` enum('account_created','promoted_to_developer','added_to_project','task_assigned','task_completed','project_completed') NOT NULL,
	`title` varchar(191) NOT NULL,
	`body` text,
	`metadata` longtext,
	`readAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passkey` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191),
	`publicKey` longtext NOT NULL,
	`userId` varchar(191) NOT NULL,
	`credentialID` varchar(512) NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`deviceType` varchar(64) NOT NULL,
	`backedUp` boolean NOT NULL DEFAULT false,
	`transports` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`aaguid` varchar(191),
	CONSTRAINT `passkey_id` PRIMARY KEY(`id`),
	CONSTRAINT `passkey_credential_unique` UNIQUE(`credentialID`)
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` varchar(191) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`description` text,
	`status` enum('draft','ongoing','on_hold','completed','cancelled') NOT NULL DEFAULT 'draft',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`startDate` datetime,
	`endDate` datetime,
	`completedAt` datetime,
	`projectLeadId` varchar(191) NOT NULL,
	`clientId` varchar(191),
	`progressPercent` int NOT NULL DEFAULT 0,
	`notes` longtext,
	`devLinks` longtext,
	`credentials` longtext,
	`createdById` varchar(191) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `projectChatMessage` (
	`id` varchar(191) NOT NULL,
	`roomId` varchar(191) NOT NULL,
	`projectId` varchar(191) NOT NULL,
	`senderId` varchar(191) NOT NULL,
	`senderRole` enum('admin','developer','client') NOT NULL,
	`displayName` varchar(191) NOT NULL,
	`text` text NOT NULL,
	`replyToMessageId` varchar(191),
	`createdAtMs` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectChatMessage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMember` (
	`projectId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`role` enum('admin','developer','client') NOT NULL DEFAULT 'developer',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectMember_projectId_userId_pk` PRIMARY KEY(`projectId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(191) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`ipAddress` varchar(255),
	`userAgent` text,
	`userId` varchar(191) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` varchar(191) NOT NULL,
	`projectId` varchar(191) NOT NULL,
	`title` varchar(191) NOT NULL,
	`description` text,
	`type` enum('feature','bug','improvement','research','support') NOT NULL DEFAULT 'feature',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('todo','in_progress','review','blocked','done') NOT NULL DEFAULT 'todo',
	`assigneeId` varchar(191),
	`createdById` varchar(191) NOT NULL,
	`dueDate` datetime,
	`startedAt` datetime,
	`completedAt` datetime,
	`estimatedHours` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `task_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskAssignment` (
	`taskId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskAssignment_taskId_userId_pk` PRIMARY KEY(`taskId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `taskChatAttachment` (
	`id` varchar(191) NOT NULL,
	`messageId` varchar(191) NOT NULL,
	`taskId` varchar(191) NOT NULL,
	`kind` enum('image','audio') NOT NULL,
	`fileName` varchar(191),
	`mimeType` varchar(191) NOT NULL,
	`sizeBytes` int NOT NULL,
	`durationMs` int,
	`width` int,
	`height` int,
	`storageKey` varchar(191) NOT NULL,
	`binary` longblob NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskChatAttachment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskChatMessage` (
	`id` varchar(191) NOT NULL,
	`roomId` varchar(191) NOT NULL,
	`taskId` varchar(191) NOT NULL,
	`senderId` varchar(191) NOT NULL,
	`senderRole` enum('admin','developer','client') NOT NULL,
	`displayName` varchar(191) NOT NULL,
	`text` text NOT NULL,
	`replyToMessageId` varchar(191),
	`reactions` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskChatMessage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskComment` (
	`id` varchar(191) NOT NULL,
	`taskId` varchar(191) NOT NULL,
	`authorId` varchar(191) NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskComment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twoFactor` (
	`id` varchar(191) NOT NULL,
	`secret` varchar(512) NOT NULL,
	`backupCodes` text NOT NULL,
	`userId` varchar(191) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twoFactor_id` PRIMARY KEY(`id`),
	CONSTRAINT `two_factor_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`email` varchar(191) NOT NULL,
	`username` varchar(191),
	`emailVerified` boolean NOT NULL DEFAULT false,
	`image` text,
	`bio` text,
	`phone` varchar(32),
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`bookingPageTitle` varchar(191),
	`bookingPageDescription` text,
	`bookingEnabled` boolean NOT NULL DEFAULT true,
	`role` enum('admin','developer','client') NOT NULL DEFAULT 'client',
	`isActive` boolean NOT NULL DEFAULT true,
	`twoFactorEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`),
	CONSTRAINT `user_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`value` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_owner_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_event_fk` FOREIGN KEY (`eventTypeId`) REFERENCES `bookingEventType`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_attendee_fk` FOREIGN KEY (`attendeeUserId`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_app_fk` FOREIGN KEY (`appConnectionId`) REFERENCES `bookingAppConnection`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingAppConnection` ADD CONSTRAINT `bac_user_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingAvailabilityOverride` ADD CONSTRAINT `bao_schedule_fk` FOREIGN KEY (`scheduleId`) REFERENCES `bookingAvailabilitySchedule`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingAvailabilitySchedule` ADD CONSTRAINT `bas_user_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingAvailabilityWindow` ADD CONSTRAINT `baw_schedule_fk` FOREIGN KEY (`scheduleId`) REFERENCES `bookingAvailabilitySchedule`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingEventType` ADD CONSTRAINT `bet_user_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingEventType` ADD CONSTRAINT `bet_schedule_fk` FOREIGN KEY (`availabilityScheduleId`) REFERENCES `bookingAvailabilitySchedule`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingEventTypeCalendar` ADD CONSTRAINT `betc_event_fk` FOREIGN KEY (`eventTypeId`) REFERENCES `bookingEventType`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingEventTypeCalendar` ADD CONSTRAINT `betc_app_fk` FOREIGN KEY (`appConnectionId`) REFERENCES `bookingAppConnection`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingEventTypeLocation` ADD CONSTRAINT `betl_event_fk` FOREIGN KEY (`eventTypeId`) REFERENCES `bookingEventType`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingEventTypeLocation` ADD CONSTRAINT `betl_app_fk` FOREIGN KEY (`appConnectionId`) REFERENCES `bookingAppConnection`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `bookingEventTypeQuestion` ADD CONSTRAINT `betq_event_fk` FOREIGN KEY (`eventTypeId`) REFERENCES `bookingEventType`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `passkey` ADD CONSTRAINT `passkey_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `project` ADD CONSTRAINT `project_projectLeadId_user_id_fk` FOREIGN KEY (`projectLeadId`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `project` ADD CONSTRAINT `project_clientId_user_id_fk` FOREIGN KEY (`clientId`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `project` ADD CONSTRAINT `project_createdById_user_id_fk` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `projectChatMessage` ADD CONSTRAINT `projectChatMessage_projectId_project_id_fk` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `projectChatMessage` ADD CONSTRAINT `projectChatMessage_senderId_user_id_fk` FOREIGN KEY (`senderId`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `projectMember` ADD CONSTRAINT `projectMember_projectId_project_id_fk` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `projectMember` ADD CONSTRAINT `projectMember_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `task` ADD CONSTRAINT `task_projectId_project_id_fk` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `task` ADD CONSTRAINT `task_assigneeId_user_id_fk` FOREIGN KEY (`assigneeId`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `task` ADD CONSTRAINT `task_createdById_user_id_fk` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `taskAssignment` ADD CONSTRAINT `taskAssignment_taskId_task_id_fk` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `taskAssignment` ADD CONSTRAINT `taskAssignment_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `taskChatAttachment` ADD CONSTRAINT `taskChatAttachment_messageId_taskChatMessage_id_fk` FOREIGN KEY (`messageId`) REFERENCES `taskChatMessage`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `taskChatAttachment` ADD CONSTRAINT `taskChatAttachment_taskId_task_id_fk` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `taskChatMessage` ADD CONSTRAINT `taskChatMessage_taskId_task_id_fk` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `taskChatMessage` ADD CONSTRAINT `taskChatMessage_senderId_user_id_fk` FOREIGN KEY (`senderId`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `taskComment` ADD CONSTRAINT `taskComment_taskId_task_id_fk` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `taskComment` ADD CONSTRAINT `taskComment_authorId_user_id_fk` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `twoFactor` ADD CONSTRAINT `twoFactor_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE INDEX `booking_owner_idx` ON `booking` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `booking_event_type_idx` ON `booking` (`eventTypeId`);--> statement-breakpoint
CREATE INDEX `booking_attendee_idx` ON `booking` (`attendeeUserId`);--> statement-breakpoint
CREATE INDEX `booking_status_idx` ON `booking` (`status`);--> statement-breakpoint
CREATE INDEX `booking_starts_at_idx` ON `booking` (`startsAt`);--> statement-breakpoint
CREATE INDEX `booking_app_connection_user_idx` ON `bookingAppConnection` (`userId`);--> statement-breakpoint
CREATE INDEX `booking_app_connection_provider_idx` ON `bookingAppConnection` (`provider`);--> statement-breakpoint
CREATE INDEX `booking_availability_override_schedule_idx` ON `bookingAvailabilityOverride` (`scheduleId`);--> statement-breakpoint
CREATE INDEX `booking_availability_override_date_idx` ON `bookingAvailabilityOverride` (`scheduleId`,`date`);--> statement-breakpoint
CREATE INDEX `booking_availability_schedule_user_idx` ON `bookingAvailabilitySchedule` (`userId`);--> statement-breakpoint
CREATE INDEX `booking_availability_window_schedule_idx` ON `bookingAvailabilityWindow` (`scheduleId`);--> statement-breakpoint
CREATE INDEX `booking_availability_window_day_idx` ON `bookingAvailabilityWindow` (`scheduleId`,`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `booking_event_type_user_idx` ON `bookingEventType` (`userId`);--> statement-breakpoint
CREATE INDEX `booking_event_type_schedule_idx` ON `bookingEventType` (`availabilityScheduleId`);--> statement-breakpoint
CREATE INDEX `booking_event_type_calendar_connection_idx` ON `bookingEventTypeCalendar` (`appConnectionId`);--> statement-breakpoint
CREATE INDEX `booking_event_type_location_event_idx` ON `bookingEventTypeLocation` (`eventTypeId`);--> statement-breakpoint
CREATE INDEX `booking_event_type_location_connection_idx` ON `bookingEventTypeLocation` (`appConnectionId`);--> statement-breakpoint
CREATE INDEX `booking_event_type_question_event_idx` ON `bookingEventTypeQuestion` (`eventTypeId`);--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notification` (`userId`);--> statement-breakpoint
CREATE INDEX `notification_event_idx` ON `notification` (`event`);--> statement-breakpoint
CREATE INDEX `passkey_user_idx` ON `passkey` (`userId`);--> statement-breakpoint
CREATE INDEX `project_lead_idx` ON `project` (`projectLeadId`);--> statement-breakpoint
CREATE INDEX `project_client_idx` ON `project` (`clientId`);--> statement-breakpoint
CREATE INDEX `project_status_idx` ON `project` (`status`);--> statement-breakpoint
CREATE INDEX `project_chat_room_idx` ON `projectChatMessage` (`roomId`);--> statement-breakpoint
CREATE INDEX `project_chat_project_idx` ON `projectChatMessage` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_chat_sender_idx` ON `projectChatMessage` (`senderId`);--> statement-breakpoint
CREATE INDEX `project_chat_created_at_ms_idx` ON `projectChatMessage` (`createdAtMs`);--> statement-breakpoint
CREATE INDEX `project_member_user_idx` ON `projectMember` (`userId`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `task_project_idx` ON `task` (`projectId`);--> statement-breakpoint
CREATE INDEX `task_assignee_idx` ON `task` (`assigneeId`);--> statement-breakpoint
CREATE INDEX `task_status_idx` ON `task` (`status`);--> statement-breakpoint
CREATE INDEX `task_assignment_task_idx` ON `taskAssignment` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_assignment_user_idx` ON `taskAssignment` (`userId`);--> statement-breakpoint
CREATE INDEX `task_chat_attachment_message_idx` ON `taskChatAttachment` (`messageId`);--> statement-breakpoint
CREATE INDEX `task_chat_attachment_task_idx` ON `taskChatAttachment` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_chat_attachment_storage_idx` ON `taskChatAttachment` (`storageKey`);--> statement-breakpoint
CREATE INDEX `task_chat_room_idx` ON `taskChatMessage` (`roomId`);--> statement-breakpoint
CREATE INDEX `task_chat_task_idx` ON `taskChatMessage` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_chat_sender_idx` ON `taskChatMessage` (`senderId`);--> statement-breakpoint
CREATE INDEX `task_comment_task_idx` ON `taskComment` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_comment_author_idx` ON `taskComment` (`authorId`);--> statement-breakpoint
CREATE INDEX `two_factor_user_idx` ON `twoFactor` (`userId`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);