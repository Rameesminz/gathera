export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const label = names.length === 1 ? `${names[0]} is typing` : `${names.join(', ')} are typing`;

  return (
    <div className="flex items-end gap-2">
      <div className="flex max-w-[120px] items-center gap-1.5 rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-sm">
        <span className="sr-only">{label}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-muted-foreground"
            style={{ animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
