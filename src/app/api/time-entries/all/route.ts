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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get("driverId");
  const week = searchParams.get("week");

  const where: Record<string, unknown> = { company: "dragonfly" };

  if (driverId) where.driverId = driverId;

  if (week) {
    const [year, weekNum] = week.split("-").map(Number);
    const { start, end } = getWeekRange(year, weekNum);
    where.date = { gte: start, lte: end };
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      driver: { select: { name: true, email: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(entries);
}
