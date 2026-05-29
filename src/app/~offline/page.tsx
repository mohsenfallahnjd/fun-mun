import { Bookmark } from "@/components/icons";
import { Link } from "@/components/Link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Bookmark className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted">
        Fun Mun needs a connection to search for new items. Your saved list is still available when
        you open the app.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground no-underline"
      >
        Back home
      </Link>
    </main>
  );
}
