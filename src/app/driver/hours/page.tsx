import { requireRole } from "@/lib/guards";
import { UrenForm } from "./uren-form";

export default async function UrenInvoerenPage() {
  await requireRole("DRIVER");

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Uren invoeren</h1>
      <UrenForm />
    </section>
  );
}
