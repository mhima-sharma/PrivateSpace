-- Add a free-text "about me" bio to users (shown on their profile page).
ALTER TABLE `users` ADD COLUMN `bio` TEXT NULL;
