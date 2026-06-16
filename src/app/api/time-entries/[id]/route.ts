import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decimalHours } from "@/lib/hours";

// Controleert of de ingelogde driver eigenaar is van deze TimeEntry.
async function ownEntry(id: string, driverId: string) {
  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry || entry.driverId !== driverId) return null;
  return entry;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await ownEntry(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const body = await req.json();
  const { date, startTime, endTime } = body;

  if (!date || !startTime || !endTime) {
    return NextResponse.json({ error: "Vul alle verplichte velden in" }, { status: 400 });
  }

  const totalHours = decimalHours(startTime, endTime);
  if (totalHours === null) {
    return NextResponse.json({ error: "Ongeldige tijden" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: { date: new Date(date), startTime, endTime, totalHours },
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await ownEntry(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
