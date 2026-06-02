-- Track when an already-registered user declines an in-app invitation.
-- Invite states: pending (used=0, rejected_at NULL) / accepted (used=1) /
-- rejected (rejected_at set). Visibility now counts ACCEPTED invites only.
ALTER TABLE `invites` ADD COLUMN `rejected_at` DATETIME(3) NULL;
