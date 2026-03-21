import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function ManagerDriversPage() {
  await requireRole("MANAGER");

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    orderBy: { name: "asc" },
    include: {
      assignments: {
        include: { shift: true },
      },
      availabilities: true,
    },
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Drivers</h1>

      <div className="glass overflow-x-auto p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-2 text-left">Name</th>
              <th className="px-2 py-2 text-left">Email</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Availabilities</th>
              <th className="px-2 py-2 text-left">Assigned shifts</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr className="border-b" key={driver.id}>
                <td className="px-2 py-2">{driver.name}</td>
                <td className="px-2 py-2">{driver.email}</td>
                <td className="px-2 py-2">{driver.active ? "Active" : "Inactive"}</td>
                <td className="px-2 py-2">{driver.availabilities.length}</td>
                <td className="px-2 py-2">{driver.assignments.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
