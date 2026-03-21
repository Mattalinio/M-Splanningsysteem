import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getWeekRange(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const start = new Date(startOfWeek1);
  start.setUTCDate(startOfWeek1.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

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

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return NextResponse.json({ error: "Eindtijd moet na starttijd liggen" }, { status: 400 });
  }

  const totalHours = (endMinutes - startMinutes) / 60;

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
    const [year, weekNum] = week.split("-").map(Number);
    const { start, end } = getWeekRange(year, weekNum);
    where.date = { gte: start, lte: end };
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(entries);
}
