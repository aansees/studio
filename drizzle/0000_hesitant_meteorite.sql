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

CREATE TABLE `notification` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`event` enum('account_created','promoted_to_developer','added_to_project','task_assigned','task_completed','project_completed') NOT NULL,
	`title` varchar(191) NOT NULL,
	`body` text,
	`metadata` json,
	`readAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_id` PRIMARY KEY(`id`)
);

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

CREATE TABLE `projectMember` (
	`projectId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`role` enum('admin','developer','client') NOT NULL DEFAULT 'developer',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectMember_projectId_userId_pk` PRIMARY KEY(`projectId`,`userId`)
);

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

CREATE TABLE `taskChatMessage` (
	`id` varchar(191) NOT NULL,
	`roomId` varchar(191) NOT NULL,
	`taskId` varchar(191) NOT NULL,
	`senderId` varchar(191) NOT NULL,
	`senderRole` enum('admin','developer','client') NOT NULL,
	`displayName` varchar(191) NOT NULL,
	`text` text NOT NULL,
	`replyToMessageId` varchar(191),
	`reactions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskChatMessage_id` PRIMARY KEY(`id`)
);

CREATE TABLE `taskComment` (
	`id` varchar(191) NOT NULL,
	`taskId` varchar(191) NOT NULL,
	`authorId` varchar(191) NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskComment_id` PRIMARY KEY(`id`)
);

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

CREATE TABLE `verification` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`value` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verification_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_value_unique` UNIQUE(`value`)
);

CREATE INDEX `account_user_idx` ON `account` (`userId`);
CREATE INDEX `notification_user_idx` ON `notification` (`userId`);
CREATE INDEX `notification_event_idx` ON `notification` (`event`);
CREATE INDEX `passkey_user_idx` ON `passkey` (`userId`);
CREATE INDEX `project_lead_idx` ON `project` (`projectLeadId`);
CREATE INDEX `project_client_idx` ON `project` (`clientId`);
CREATE INDEX `project_status_idx` ON `project` (`status`);
CREATE INDEX `project_member_user_idx` ON `projectMember` (`userId`);
CREATE INDEX `session_user_idx` ON `session` (`userId`);
CREATE INDEX `task_project_idx` ON `task` (`projectId`);
CREATE INDEX `task_assignee_idx` ON `task` (`assigneeId`);
CREATE INDEX `task_status_idx` ON `task` (`status`);
CREATE INDEX `task_chat_room_idx` ON `taskChatMessage` (`roomId`);
CREATE INDEX `task_chat_task_idx` ON `taskChatMessage` (`taskId`);
CREATE INDEX `task_chat_sender_idx` ON `taskChatMessage` (`senderId`);
CREATE INDEX `task_comment_task_idx` ON `taskComment` (`taskId`);
CREATE INDEX `task_comment_author_idx` ON `taskComment` (`authorId`);
CREATE INDEX `two_factor_user_idx` ON `twoFactor` (`userId`);
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
