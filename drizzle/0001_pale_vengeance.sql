ALTER TABLE `booking` ADD `projectId` varchar(191);--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_project_unique` UNIQUE(`projectId`);--> statement-breakpoint
ALTER TABLE `booking` ADD CONSTRAINT `booking_project_fk` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `booking_owner_time_status_idx` ON `booking` (`ownerUserId`,`startsAt`,`endsAt`,`status`);