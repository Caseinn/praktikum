export default function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fd-background text-fd-foreground">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-fd-border bg-fd-card px-6 py-5 shadow-sm">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-fd-border border-t-fd-primary" />
        <span className="text-xs text-fd-muted-foreground">Memuat...</span>
      </div>
    </main>
  );
}
