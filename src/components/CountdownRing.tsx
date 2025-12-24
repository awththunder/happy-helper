import { useMemo } from 'react';

interface CountdownRingProps {
  timeLeft: number;
  period: number;
  size?: number;
}

export function CountdownRing({ timeLeft, period, size = 48 }: CountdownRingProps) {
  const { circumference, offset, strokeColor } = useMemo(() => {
    const radius = (size - 4) / 2;
    const circ = 2 * Math.PI * radius;
    const progress = timeLeft / period;
    const off = circ * (1 - progress);
    
    // Color based on time remaining
    let color = 'hsl(var(--primary))';
    if (timeLeft <= 5) {
      color = 'hsl(var(--destructive))';
    } else if (timeLeft <= 10) {
      color = 'hsl(var(--warning))';
    }
    
    return { circumference: circ, offset: off, strokeColor: color };
  }, [timeLeft, period, size]);

  const radius = (size - 4) / 2;
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="3"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span 
        className="absolute font-mono text-sm font-medium"
        style={{ color: strokeColor }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
