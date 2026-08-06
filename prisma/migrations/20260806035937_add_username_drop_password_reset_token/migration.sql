-- AlterTable: add username as nullable first so existing rows can be backfilled
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Backfill: derive from the email local-part, sanitized, de-duplicated with a numeric suffix
WITH base AS (
    SELECT
        id,
        NULLIF(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9._-]', '', 'g'), '') AS candidate,
        "createdAt"
    FROM "users"
),
numbered AS (
    SELECT
        id,
        COALESCE(candidate, 'user' || substr(id, 1, 8)) AS candidate,
        row_number() OVER (
            PARTITION BY COALESCE(candidate, 'user' || substr(id, 1, 8))
            ORDER BY "createdAt"
        ) AS rn
    FROM base
)
UPDATE "users" u
SET "username" = CASE WHEN numbered.rn = 1 THEN numbered.candidate ELSE numbered.candidate || numbered.rn::text END
FROM numbered
WHERE u.id = numbered.id;

-- Enforce NOT NULL + uniqueness going forward
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- DropTable (also drops its FK constraint to users)
DROP TABLE "password_reset_tokens";
