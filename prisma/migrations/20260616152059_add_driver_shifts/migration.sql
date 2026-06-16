-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('DHL_OCHTEND', 'DRAGONFLY_MIDDAG');

-- CreateTable
CREATE TABLE "driver_shifts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ShiftType" NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "packages" INTEGER,
    "stops" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "driver_shifts_userId_date_idx" ON "driver_shifts"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "driver_shifts_userId_date_type_key" ON "driver_shifts"("userId", "date", "type");

-- AddForeignKey
ALTER TABLE "driver_shifts" ADD CONSTRAINT "driver_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
