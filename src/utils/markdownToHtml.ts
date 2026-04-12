type Segment =
  | { kind: "plain"; text: string }
  | { kind: "quote"; expandable: boolean; inner: string };

/** Строки, начинающиеся с `> `, склеиваем в один `<blockquote>...</blockquote>`. */
function foldMarkdownBlockquotes(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  const quoteLines: string[] = [];

  const flushQuote = (): void => {
    if (quoteLines.length > 0) {
      out.push(`<blockquote>${quoteLines.join("\n")}</blockquote>`);
      quoteLines.length = 0;
    }
  };

  for (const line of lines) {
    const m = line.match(/^>\s?(.*)$/);
    if (m) {
      quoteLines.push(m[1] ?? "");
    } else {
      flushQuote();
      out.push(line);
    }
  }
  flushQuote();
  return out.join("\n");
}

/** Разбивает текст на куски вне/внутри `<blockquote>` (в т.ч. `<blockquote expandable>`). */
function extractSegments(text: string): Segment[] {
  const re = /<blockquote(\s+expandable)?>([\s\S]*?)<\/blockquote>/gi;
  const segments: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ kind: "plain", text: text.slice(last, m.index) });
    }
    segments.push({
      kind: "quote",
      expandable: Boolean(m[1]?.trim()),
      inner: m[2] ?? "",
    });
    last = re.lastIndex;
  }
  if (last < text.length) {
    segments.push({ kind: "plain", text: text.slice(last) });
  }
  if (segments.length === 0) {
    segments.push({ kind: "plain", text });
  }
  return segments;
}

function applyInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<i>$1</i>")
    .replace(/_(.+?)_/g, "<i>$1</i>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

/**
 * Мини-разметка поста → Telegram HTML: **жирный**, *курсив*, `код`,
 * абзацы с префиксом `> ` и теги `<blockquote>` / `<blockquote expandable>`.
 */
export function markdownToHtml(text: string): string {
  const folded = foldMarkdownBlockquotes(text.trim());
  const segments = extractSegments(folded);
  return segments
    .map((seg) => {
      if (seg.kind === "plain") {
        return applyInline(seg.text);
      }
      const open = seg.expandable ? "<blockquote expandable>" : "<blockquote>";
      return `${open}${applyInline(seg.inner.trim())}</blockquote>`;
    })
    .join("");
}
