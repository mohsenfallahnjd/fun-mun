"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, Loader2 } from "@/components/icons";
import { Link } from "@/components/Link";
import { isValidHttpUrl } from "@/lib/link-preview";

function ReaderContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url")?.trim() ?? "";
  const back = searchParams.get("back")?.trim() ?? "/";
  const valid = isValidHttpUrl(url);

  if (!valid) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">Invalid or missing article URL.</p>
        <Link href={back} className="mt-4 inline-block font-medium">
          Go back
        </Link>
      </div>
    );
  }

  const readerSrc = `/api/read?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-md">
        <Link
          href={back}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted no-underline hover:bg-muted/40 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="min-w-0 flex-1 truncate text-sm text-muted">{new URL(url).hostname}</span>
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-accent no-underline hover:bg-accent/10"
        >
          <ExternalLink className="h-4 w-4" />
          Original
        </Link>
      </header>
      <iframe
        title="Article reader"
        src={readerSrc}
        className="min-h-0 flex-1 w-full border-0 bg-white"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      }
    >
      <ReaderContent />
    </Suspense>
  );
}
