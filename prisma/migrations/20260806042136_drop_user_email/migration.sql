-- AlterTable: users no longer track email; username is the sole identifier
ALTER TABLE "users" DROP COLUMN "email";
ALTER TABLE "users" DROP COLUMN "emailVerified";
