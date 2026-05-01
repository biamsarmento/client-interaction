interface HealthScoreProps {
  score: number;
  statusColor: string;
}

export default function HealthScore({ score, statusColor }: HealthScoreProps) {
  const dots = Array.from({ length: 5 }, (_, i) => i < score);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {dots.map((filled, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border-2"
            style={{
              backgroundColor: filled ? statusColor : "transparent",
              borderColor: statusColor,
            }}
          />
        ))}
      </div>
      <span className="text-sm font-semibold" style={{ color: statusColor }}>
        {score}/5
      </span>
    </div>
  );
}
