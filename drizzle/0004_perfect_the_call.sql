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
CREATE INDEX `project_chat_room_idx` ON `projectChatMessage` (`roomId`);--> statement-breakpoint
CREATE INDEX `project_chat_project_idx` ON `projectChatMessage` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_chat_sender_idx` ON `projectChatMessage` (`senderId`);--> statement-breakpoint
CREATE INDEX `project_chat_created_at_ms_idx` ON `projectChatMessage` (`createdAtMs`);--> statement-breakpoint
CREATE INDEX `task_assignment_task_idx` ON `taskAssignment` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_assignment_user_idx` ON `taskAssignment` (`userId`);--> statement-breakpoint
CREATE INDEX `task_chat_attachment_message_idx` ON `taskChatAttachment` (`messageId`);--> statement-breakpoint
CREATE INDEX `task_chat_attachment_task_idx` ON `taskChatAttachment` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_chat_attachment_storage_idx` ON `taskChatAttachment` (`storageKey`);