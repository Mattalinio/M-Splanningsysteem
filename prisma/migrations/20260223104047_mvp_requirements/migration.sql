/*
  Warnings:

  - You are about to drop the column `location` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whereNeeded` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stopsDelivered" INTEGER,
    "packagesDelivered" INTEGER,
    "shiftNote" TEXT,
    "shiftNoteReadAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_assignments" ("createdAt", "id", "taskId", "userId") SELECT "createdAt", "id", "taskId", "userId" FROM "assignments";
DROP TABLE "assignments";
ALTER TABLE "new_assignments" RENAME TO "assignments";
CREATE UNIQUE INDEX "assignments_taskId_key" ON "assignments"("taskId");
CREATE INDEX "assignments_userId_createdAt_idx" ON "assignments"("userId", "createdAt");
CREATE TABLE "new_availabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "note" TEXT,
    "noteReadAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_availabilities" ("createdAt", "date", "endTime", "id", "startTime", "status", "updatedAt", "userId") SELECT "createdAt", "date", "endTime", "id", "startTime", "status", "updatedAt", "userId" FROM "availabilities";
DROP TABLE "availabilities";
ALTER TABLE "new_availabilities" RENAME TO "availabilities";
CREATE INDEX "availabilities_userId_date_idx" ON "availabilities"("userId", "date");
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "whereNeeded" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tasks" ("createdAt", "date", "endTime", "id", "notes", "startTime", "status", "updatedAt") SELECT "createdAt", "date", "endTime", "id", "notes", "startTime", "status", "updatedAt" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE INDEX "tasks_date_whereNeeded_idx" ON "tasks"("date", "whereNeeded");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'EN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("active", "createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt") SELECT "active", "createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
