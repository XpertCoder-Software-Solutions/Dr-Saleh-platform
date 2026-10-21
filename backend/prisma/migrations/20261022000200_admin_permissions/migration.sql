-- Staff accounts: admins limited to the dashboard sections a super admin picks.
-- Every admin that exists today keeps full access.
ALTER TABLE "users" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "adminPermissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "users"
SET "isSuperAdmin" = true
WHERE "roleId" IN (SELECT "id" FROM "roles" WHERE "name" = 'Admin');
