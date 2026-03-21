import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.active) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: Role) {
  const session = await requireAuth();

  if (session.user.role !== role) {
    if (session.user.role === "MANAGER") {
      redirect("/manager");
    }
    redirect("/driver");
  }

  return session;
}
