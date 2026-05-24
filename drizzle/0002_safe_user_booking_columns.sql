ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `bookingPageTitle` varchar(191);--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `bookingPageDescription` text;--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `bookingEnabled` boolean NOT NULL DEFAULT true;
