import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeShift, shiftInputSchema } from "@/lib/shifts";

// Controleert of de ingelogde driver eigenaar is van deze dienst.
async function ownShift(id: string, userId: string) {
  const shift = await prisma.driverShift.findUnique({ where: { id } });
  if (!shift || shift.userId !== userId) return null;
  return shift;
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
  if (!(await ownShift(id, session.user.id))) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
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
    const shift = await prisma.driverShift.update({
      where: { id },
      data: normalized.data,
    });
    return NextResponse.json(shift);
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });
  }

  const { id } = await params;
  if (!(await ownShift(id, session.user.id))) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  await prisma.driverShift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
