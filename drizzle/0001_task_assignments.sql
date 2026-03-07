CREATE TABLE `taskAssignment` (
	`taskId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskAssignment_taskId_userId_pk` PRIMARY KEY(`taskId`,`userId`)
);

CREATE INDEX `task_assignment_task_idx` ON `taskAssignment` (`taskId`);
CREATE INDEX `task_assignment_user_idx` ON `taskAssignment` (`userId`);

INSERT INTO `taskAssignment` (`taskId`, `userId`, `assignedAt`)
SELECT `id`, `assigneeId`, now()
FROM `task`
WHERE `assigneeId` IS NOT NULL;
