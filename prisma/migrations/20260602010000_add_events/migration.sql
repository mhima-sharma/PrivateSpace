-- Story-style ephemeral events created by admins. Visible on the dashboard
-- until `expires_at`, then retained for the admin archive.
CREATE TABLE `events` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NULL,
  `image_url` VARCHAR(191) NULL,
  `mime_type` VARCHAR(191) NULL,
  `size_bytes` INTEGER NULL,
  `created_by` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NOT NULL,
  INDEX `events_created_by_idx`(`created_by`),
  INDEX `events_expires_at_idx`(`expires_at`),
  INDEX `events_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
