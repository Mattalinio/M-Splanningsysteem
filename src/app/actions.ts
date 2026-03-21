"use server";

import { AvailabilityStatus, Role, ShiftBlockType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { SHIFT_BLOCKS } from "@/lib/planning";
import { prisma } from "@/lib/prisma";
import { containsRange, isValidHour, isValidRange, rangesOverlap } from "@/lib/time";

function parseText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseIntField(formData: FormData, key: string): number {
  return Number(parseText(formData, key));
}

function redirectWithToast(path: string, toast: string) {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}toast=${encodeURIComponent(toast)}`);
}

function managerReturnTo(formData: FormData, fallback: string): string {
  const returnTo = parseText(formData, "returnTo");
  if (returnTo.startsWith("/manager")) {
    return returnTo;
  }
  return fallback;
}

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.active) {
    throw new Error("Please log in first");
  }
  return session;
}

async function requireManager() {
  const session = await requireAuth();
  if (session.user.role !== "MANAGER") {
    throw new Error("Only managers can do this");
  }
  return session;
}

async function requireDriver() {
  const session = await requireAuth();
  if (session.user.role !== "DRIVER") {
    throw new Error("Only drivers can do this");
  }
  return session;
}

async function syncAvailabilityLocks(userId: string, date: string) {
  const [availabilities, assignments] = await Promise.all([
    prisma.availability.findMany({ where: { userId, date } }),
    prisma.assignment.findMany({
      where: { userId, shift: { date } },
      include: { shift: true },
    }),
  ]);

  await Promise.all(
    availabilities.map((availability) => {
      const locked = assignments.some((assignment) =>
        rangesOverlap(
          availability.startHour,
          availability.endHour,
          assignment.shift.startHour,
          assignment.shift.endHour,
        ),
      );

      return prisma.availability.update({
        where: { id: availability.id },
        data: { status: locked ? AvailabilityStatus.LOCKED : AvailabilityStatus.FREE },
      });
    }),
  );
}

export async function signUpDriverAction(formData: FormData) {
  const parsed = z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    })
    .parse({
      name: parseText(formData, "name"),
      email: parseText(formData, "email").toLowerCase(),
      password: parseText(formData, "password"),
    });

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    throw new Error("This email is already in use");
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      role: Role.DRIVER,
      active: true,
    },
  });

  redirectWithToast("/login", "Account created");
}

export async function addAvailabilityAction(formData: FormData) {
  const session = await requireDriver();
  const date = parseText(formData, "date");
  const startHour = parseIntField(formData, "startHour");
  const endHour = parseIntField(formData, "endHour");

  if (!date || !isValidRange(startHour, endHour)) {
    throw new Error("Please select a valid date and hour range");
  }

  await prisma.availability.create({
    data: {
      userId: session.user.id,
      date,
      startHour,
      endHour,
    },
  });

  await syncAvailabilityLocks(session.user.id, date);
  redirectWithToast("/driver/availability", "Saved");
}

export async function addBulkAvailabilityAction(formData: FormData) {
  const session = await requireDriver();
  const selectedDates = formData.getAll("selectedDates").map((value) => String(value));
  const startHour = parseIntField(formData, "startHour");
  const endHour = parseIntField(formData, "endHour");

  if (selectedDates.length === 0) {
    throw new Error("Select at least one date");
  }
  if (!isValidRange(startHour, endHour)) {
    throw new Error("Please select a valid hour range");
  }

  await Promise.all(
    selectedDates.map(async (date) => {
      const exists = await prisma.availability.findFirst({
        where: { userId: session.user.id, date, startHour, endHour },
        select: { id: true },
      });
      if (!exists) {
        await prisma.availability.create({
          data: { userId: session.user.id, date, startHour, endHour },
        });
      }
      await syncAvailabilityLocks(session.user.id, date);
    }),
  );

  redirectWithToast("/driver/availability", "Saved");
}

export async function updateAvailabilityAction(formData: FormData) {
  const session = await requireDriver();
  const availabilityId = parseText(formData, "availabilityId");
  const date = parseText(formData, "date");
  const startHour = parseIntField(formData, "startHour");
  const endHour = parseIntField(formData, "endHour");

  if (!date || !isValidRange(startHour, endHour)) {
    throw new Error("Please select a valid date and hour range");
  }

  const availability = await prisma.availability.findFirst({
    where: { id: availabilityId, userId: session.user.id },
  });
  if (!availability) {
    throw new Error("Availability not found");
  }

  const overlappingAssignments = await prisma.assignment.findMany({
    where: {
      userId: session.user.id,
      shift: {
        date: availability.date,
      },
    },
    include: { shift: true },
  });

  const hasLockedOverlap = overlappingAssignments.some((assignment) =>
    rangesOverlap(
      availability.startHour,
      availability.endHour,
      assignment.shift.startHour,
      assignment.shift.endHour,
    ),
  );

  if (hasLockedOverlap) {
    throw new Error("This availability is locked because a shift overlaps it");
  }

  await prisma.availability.update({
    where: { id: availability.id },
    data: { date, startHour, endHour },
  });

  await syncAvailabilityLocks(session.user.id, availability.date);
  if (availability.date !== date) {
    await syncAvailabilityLocks(session.user.id, date);
  }

  redirectWithToast("/driver/availability", "Saved");
}

export async function deleteAvailabilityAction(formData: FormData) {
  const session = await requireDriver();
  const availabilityId = parseText(formData, "availabilityId");

  const availability = await prisma.availability.findFirst({
    where: { id: availabilityId, userId: session.user.id },
  });
  if (!availability) {
    throw new Error("Availability not found");
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      userId: session.user.id,
      shift: { date: availability.date },
    },
    include: { shift: true },
  });

  const locked = assignments.some((assignment) =>
    rangesOverlap(
      availability.startHour,
      availability.endHour,
      assignment.shift.startHour,
      assignment.shift.endHour,
    ),
  );

  if (locked) {
    throw new Error("This availability is locked because a shift overlaps it");
  }

  await prisma.availability.delete({ where: { id: availability.id } });
  redirectWithToast("/driver/availability", "Deleted");
}

export async function createShiftsFromBlocksAction(formData: FormData) {
  await requireManager();
  const date = parseText(formData, "date");
  const blockTypes = formData.getAll("blockTypes").map((value) => String(value) as ShiftBlockType);

  if (!date || blockTypes.length === 0) {
    throw new Error("Select a date and at least one block");
  }

  for (const blockType of blockTypes) {
    if (!(blockType in SHIFT_BLOCKS)) {
      throw new Error("Invalid shift block selected");
    }
  }

  await Promise.all(
    blockTypes.map(async (blockType) => {
      const block = SHIFT_BLOCKS[blockType];
      const exists = await prisma.shift.findFirst({
        where: {
          date,
          blockType,
          startHour: block.startHour,
          endHour: block.endHour,
          whereNeeded: block.whereNeeded,
        },
        select: { id: true },
      });

      if (exists) {
        return;
      }

      await prisma.shift.create({
        data: {
          date,
          blockType,
          whereNeeded: block.whereNeeded,
          startHour: block.startHour,
          endHour: block.endHour,
          status: "OPEN",
        },
      });
    }),
  );

  redirectWithToast(managerReturnTo(formData, `/manager?date=${date}`), "Shifts added");
}

export async function assignShiftAction(formData: FormData) {
  await requireManager();
  const shiftId = parseText(formData, "shiftId");
  const userId = parseText(formData, "userId");

  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.status !== "OPEN") {
    throw new Error("Shift is not open");
  }

  const driver = await prisma.user.findFirst({
    where: { id: userId, role: Role.DRIVER, active: true },
  });
  if (!driver) {
    throw new Error("Driver not found");
  }

  const availabilities = await prisma.availability.findMany({
    where: { userId: driver.id, date: shift.date },
  });

  const covered = availabilities.some((availability) =>
    containsRange(availability.startHour, availability.endHour, shift.startHour, shift.endHour),
  );

  if (!covered) {
    throw new Error("Driver availability does not cover this shift");
  }

  const assignments = await prisma.assignment.findMany({
    where: { userId: driver.id, shift: { date: shift.date } },
    include: { shift: true },
  });

  const overlaps = assignments.some((assignment) =>
    rangesOverlap(shift.startHour, shift.endHour, assignment.shift.startHour, assignment.shift.endHour),
  );

  if (overlaps) {
    throw new Error("Driver is already booked on an overlapping shift");
  }

  await prisma.$transaction([
    prisma.assignment.create({
      data: { shiftId: shift.id, userId: driver.id },
    }),
    prisma.shift.update({ where: { id: shift.id }, data: { status: "ASSIGNED" } }),
  ]);

  await syncAvailabilityLocks(driver.id, shift.date);
  redirectWithToast(managerReturnTo(formData, "/manager"), "Assigned");
}

export async function unassignShiftAction(formData: FormData) {
  await requireManager();
  const shiftId = parseText(formData, "shiftId");

  const assignment = await prisma.assignment.findUnique({
    where: { shiftId },
    include: { shift: true },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  await prisma.$transaction([
    prisma.assignment.delete({ where: { id: assignment.id } }),
    prisma.shift.update({ where: { id: shiftId }, data: { status: "OPEN" } }),
  ]);

  await syncAvailabilityLocks(assignment.userId, assignment.shift.date);
  redirectWithToast(managerReturnTo(formData, "/manager"), "Unassigned");
}

export async function deleteOpenShiftAction(formData: FormData) {
  await requireManager();
  const shiftId = parseText(formData, "shiftId");

  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) {
    throw new Error("Shift not found");
  }
  if (shift.status !== "OPEN") {
    throw new Error("Only open shifts can be deleted");
  }

  await prisma.shift.delete({ where: { id: shift.id } });
  redirectWithToast(managerReturnTo(formData, "/manager"), "Deleted");
}

export async function updateAccountNameAction(formData: FormData) {
  const session = await requireAuth();
  const name = parseText(formData, "name");

  if (name.length < 2) {
    throw new Error("Name is too short");
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { name } });
  redirectWithToast("/account", "Saved");
}

export async function updateAccountPasswordAction(formData: FormData) {
  const session = await requireAuth();
  const currentPassword = parseText(formData, "currentPassword");
  const newPassword = parseText(formData, "newPassword");

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    throw new Error("User not found");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  redirectWithToast("/account", "Password changed");
}

export async function clearDemoDataAction() {
  await requireManager();
  await prisma.assignment.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.availability.updateMany({ data: { status: "FREE" } });
  revalidatePath("/manager");
}

export async function validateHourInputs(hours: number[]) {
  return hours.every((hour) => isValidHour(hour));
}
