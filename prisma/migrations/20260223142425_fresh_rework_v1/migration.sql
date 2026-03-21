/*
  Warnings:

  - You are about to drop the `tasks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `packagesDelivered` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `shiftNote` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `shiftNoteReadAt` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `stopsDelivered` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `availabilities` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `availabilities` table. All the data in the column will be lost.
  - You are about to drop the column `noteReadAt` on the `availabilities` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `availabilities` table. All the data in the column will be lost.
  - You are about to drop the column `preferredLanguage` on the `users` table. All the data in the column will be lost.
  - Added the required column `shiftId` to the `assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endHour` to the `availabilities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startHour` to the `availabilities` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tasks_date_whereNeeded_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tasks";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "blockType" TEXT NOT NULL,
    "whereNeeded" TEXT NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_assignments" ("createdAt", "id", "userId") SELECT "createdAt", "id", "userId" FROM "assignments";
DROP TABLE "assignments";
ALTER TABLE "new_assignments" RENAME TO "assignments";
CREATE UNIQUE INDEX "assignments_shiftId_key" ON "assignments"("shiftId");
CREATE INDEX "assignments_userId_createdAt_idx" ON "assignments"("userId", "createdAt");
CREATE TABLE "new_availabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_availabilities" ("createdAt", "date", "id", "status", "updatedAt", "userId") SELECT "createdAt", "date", "id", "status", "updatedAt", "userId" FROM "availabilities";
DROP TABLE "availabilities";
ALTER TABLE "new_availabilities" RENAME TO "availabilities";
CREATE INDEX "availabilities_userId_date_idx" ON "availabilities"("userId", "date");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("active", "createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt") SELECT "active", "createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "shifts_date_status_idx" ON "shifts"("date", "status");
