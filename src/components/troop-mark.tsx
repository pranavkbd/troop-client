export function TroopMark({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 24"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Troop</title>
      <polyline points="2 19 7 12 2 5" strokeOpacity={0.35} />
      <polyline points="11 19 16 12 11 5" strokeOpacity={0.65} />
      <polyline points="20 19 25 12 20 5" />
    </svg>
  );
}
