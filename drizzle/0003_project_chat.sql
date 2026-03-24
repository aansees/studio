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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `projectChatMessage_id` PRIMARY KEY(`id`)
);

CREATE INDEX `project_chat_room_idx` ON `projectChatMessage` (`roomId`);
CREATE INDEX `project_chat_project_idx` ON `projectChatMessage` (`projectId`);
CREATE INDEX `project_chat_sender_idx` ON `projectChatMessage` (`senderId`);
CREATE INDEX `project_chat_created_at_ms_idx` ON `projectChatMessage` (`createdAtMs`);
