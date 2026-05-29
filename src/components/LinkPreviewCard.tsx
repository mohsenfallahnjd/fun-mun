import { Image } from "@/components/Image";
import { Loader2, X } from "@/components/icons";
import type { LinkPreviewData } from "@/lib/link-preview";

interface LinkPreviewProps {
  preview: LinkPreviewData | null;
  loading?: boolean;
  onApply?: () => void;
  onDismiss?: () => void;
}

export function LinkPreviewCard({ preview, loading, onApply, onDismiss }: LinkPreviewProps) {
  if (loading) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Fetching link preview…
      </div>
    );
  }

  if (!preview?.title && !preview?.description && !preview?.imageUrl) {
    return null;
  }

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-muted/20">
      <div className="flex gap-3 p-3">
        {preview.imageUrl && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={preview.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {preview.siteName && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {preview.siteName}
            </p>
          )}
          {preview.title && <p className="truncate text-sm font-semibold">{preview.title}</p>}
          {preview.description && (
            <p className="line-clamp-2 text-xs text-muted">{preview.description}</p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-1 text-muted hover:bg-muted/60"
            aria-label="Dismiss preview"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {onApply && (
        <div className="border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={onApply}
            className="text-xs font-medium text-accent hover:underline"
          >
            Apply to form fields
          </button>
        </div>
      )}
    </div>
  );
}
