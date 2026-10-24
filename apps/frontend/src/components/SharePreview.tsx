interface SharePreviewProps {
  shareText: string;
}

// Shows exactly the text `useShare` will copy/share, in Harfhane's own progress-bar format
// (owner decision 2026-10-24, docs/decisions/2026-10-24-share-format.md) — never a colored
// positional tile grid.
function SharePreview({ shareText }: SharePreviewProps): React.JSX.Element {
  return (
    <div className="w-full rounded-xl border border-border-color bg-bg-primary overflow-hidden">
      <pre
        data-testid="share-preview-text"
        className="px-4 py-3 font-mono text-sm text-text-primary whitespace-pre-wrap break-words"
      >
        {shareText}
      </pre>
    </div>
  );
}

export default SharePreview;
