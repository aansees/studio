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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `taskChatAttachment_id` PRIMARY KEY(`id`)
);

CREATE INDEX `task_chat_attachment_message_idx` ON `taskChatAttachment` (`messageId`);
CREATE INDEX `task_chat_attachment_task_idx` ON `taskChatAttachment` (`taskId`);
CREATE INDEX `task_chat_attachment_storage_idx` ON `taskChatAttachment` (`storageKey`);
