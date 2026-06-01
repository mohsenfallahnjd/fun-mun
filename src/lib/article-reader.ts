const BLOCKED_TAGS =
  /<\/?(?:script|style|iframe|object|embed|form|input|button|link|meta|base)[^>]*>/gi;
const EVENT_HANDLERS = /\s(on\w+|style)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

function resolveRelativeUrl(base: string, href: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function extractMainHtml(html: string): string {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch?.[1]) return articleMatch[1];

  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch?.[1]) return mainMatch[1];

  const roleMatch = html.match(/<div[^>]+role=["']main["'][^>]*>([\s\S]*?)<\/div>/i);
  if (roleMatch?.[1]) return roleMatch[1];

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? html;
}

function sanitizeHtml(fragment: string, baseUrl: string): string {
  let safe = fragment
    .replace(BLOCKED_TAGS, "")
    .replace(EVENT_HANDLERS, "")
    .replace(/javascript:/gi, "");

  safe = safe.replace(/\s(href|src)=("([^"]*)"|'([^']*)')/gi, (match, attr, _quote, dbl, sgl) => {
    const value = dbl ?? sgl ?? "";
    if (!value || value.startsWith("#") || value.startsWith("mailto:")) return match;
    const resolved = resolveRelativeUrl(baseUrl, value);
    return ` ${attr}="${resolved}"`;
  });

  return safe;
}

export function extractReadableArticle(html: string, pageUrl: string): string {
  const main = extractMainHtml(html.slice(0, 500_000));
  return sanitizeHtml(main, pageUrl);
}

export function articleReaderDocument(
  title: string,
  contentHtml: string,
  sourceUrl: string,
): string {
  const escapedTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapedSource = sourceUrl.replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapedTitle}</title>
  <style>
    body { font-family: ui-serif, Georgia, serif; line-height: 1.7; max-width: 42rem; margin: 0 auto; padding: 1.5rem; color: #1e293b; background: #fff; }
    img { max-width: 100%; height: auto; border-radius: 0.5rem; }
    a { color: #2563eb; }
    h1,h2,h3 { line-height: 1.3; font-family: ui-sans-serif, system-ui, sans-serif; }
    blockquote { border-left: 3px solid #e2e8f0; margin-left: 0; padding-left: 1rem; color: #64748b; }
    .source { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.875rem; margin-bottom: 2rem; }
    .source a { font-weight: 500; }
    @media (prefers-color-scheme: dark) {
      body { color: #f1f5f9; background: #09090b; }
      a { color: #60a5fa; }
      blockquote { border-color: #334155; color: #94a3b8; }
    }
  </style>
</head>
<body>
  <p class="source">Reading from <a href="${escapedSource}" target="_blank" rel="noopener noreferrer">${escapedSource}</a></p>
  ${contentHtml}
</body>
</html>`;
}
