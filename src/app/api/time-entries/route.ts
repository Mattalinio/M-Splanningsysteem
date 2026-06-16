import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decimalHours, getWeekRange, parseWeekParam } from "@/lib/hours";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });
  }

  const body = await req.json();
  const { date, startTime, endTime, shiftId } = body;

  if (!date || !startTime || !endTime) {
    return NextResponse.json({ error: "Vul alle verplichte velden in" }, { status: 400 });
  }

  const totalHours = decimalHours(startTime, endTime);
  if (totalHours === null) {
    return NextResponse.json({ error: "Ongeldige tijden" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.create({
    data: {
      driverId: session.user.id,
      shiftId: shiftId || null,
      date: new Date(date),
      startTime,
      endTime,
      totalHours,
      company: "dragonfly",
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week");

  const where: Record<string, unknown> = { driverId: session.user.id };

  if (week) {
    const { year, week: weekNum } = parseWeekParam(week);
    const { start, end } = getWeekRange(year, weekNum);
    where.date = { gte: start, lte: end };
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(entries);
}
