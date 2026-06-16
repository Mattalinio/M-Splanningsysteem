import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeekRange, parseWeekParam } from "@/lib/hours";
import { normalizeShift, shiftInputSchema } from "@/lib/shifts";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week");

  const where: Prisma.DriverShiftWhereInput = { userId: session.user.id };
  if (week) {
    const { year, week: weekNum } = parseWeekParam(week);
    const { start, end } = getWeekRange(year, weekNum);
    where.date = { gte: start, lte: end };
  }

  const shifts = await prisma.driverShift.findMany({
    where,
    orderBy: [{ date: "asc" }, { type: "asc" }],
  });

  return NextResponse.json(shifts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });
  }

  const parsed = shiftInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Controleer je invoer" },
      { status: 400 },
    );
  }

  const normalized = normalizeShift(parsed.data);
  if ("error" in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  try {
    const shift = await prisma.driverShift.create({
      data: { userId: session.user.id, ...normalized.data },
    });
    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Je hebt op deze dag al een dienst van dit type." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
  }
}
