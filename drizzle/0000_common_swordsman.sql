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
	`emailVerified` boolean NOT NULL DEFAULT false,
	`image` text,
	`role` enum('admin','developer','client') NOT NULL DEFAULT 'client',
	`isActive` boolean NOT NULL DEFAULT true,
	`twoFactorEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
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