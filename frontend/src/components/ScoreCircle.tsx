import { cn } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function ScoreCircle({ score, size = 'md', label }: ScoreCircleProps) {
  const radius = size === 'lg' ? 54 : size === 'md' ? 40 : 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4;

  const svgSize = (radius + strokeWidth) * 2;

  const getColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStrokeColor = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="transform -rotate-90">
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', getColor(), {
            'text-2xl': size === 'lg',
            'text-lg': size === 'md',
            'text-sm': size === 'sm',
          })}>
            {Math.round(score)}%
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
    </div>
  );
}
