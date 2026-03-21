export default function ManagerLoading() {
  return (
    <section className="space-y-3">
      <div className="glass h-12 animate-pulse" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="glass h-40 animate-pulse" />
        <div className="glass h-40 animate-pulse" />
      </div>
      <div className="glass h-64 animate-pulse" />
    </section>
  );
}
