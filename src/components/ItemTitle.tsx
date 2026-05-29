interface ItemTitleProps {
  title: string;
  originalTitle?: string;
  className?: string;
  originalClassName?: string;
}

export function ItemTitle({
  title,
  originalTitle,
  className = "",
  originalClassName = "text-xs text-muted",
}: ItemTitleProps) {
  const showOriginal = originalTitle && originalTitle !== title;

  return (
    <span className={className}>
      <span>{title}</span>
      {showOriginal && (
        <span className={`mt-0.5 block font-normal ${originalClassName}`}>{originalTitle}</span>
      )}
    </span>
  );
}
