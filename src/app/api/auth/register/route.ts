import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in."),
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
  password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens zijn."),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Controleer je gegevens.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Er bestaat al een account met dit e-mailadres." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: { name, email, passwordHash, role: "DRIVER" },
    });
  } catch (error) {
    // Vangt de race-conditie waarbij twee aanvragen tegelijk hetzelfde adres registreren.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Er bestaat al een account met dit e-mailadres." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Aanmaken mislukt. Probeer het opnieuw." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
