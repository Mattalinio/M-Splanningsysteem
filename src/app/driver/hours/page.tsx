import { redirect } from "next/navigation";

// Uren invoeren en het weekoverzicht zijn samengevoegd in één scherm.
export default function UrenPage() {
  redirect("/driver/hours/week");
}
