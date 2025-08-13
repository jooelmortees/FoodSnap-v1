import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string; // Expects a Tailwind text color class, e.g., "text-primary"
  className?: string; // Allow additional classes
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'text-primary',
  className = '',
}) => {
  let sizeClasses = '';
  switch (size) {
    case 'small':
      sizeClasses = 'w-5 h-5';
      break;
    case 'medium':
      sizeClasses = 'w-8 h-8';
      break;
    case 'large':
      sizeClasses = 'w-12 h-12';
      break;
    default:
      sizeClasses = 'w-8 h-8';
  }

  const bars = Array.from({ length: 8 });
  const animationDuration = 1.2; // seconds

  return (
    <div
      role="status"
      className={`inline-block ${sizeClasses} ${className}`}
      aria-live="polite"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
        className={`w-full h-full ${color}`}
        style={{ background: 'none' }}
      >
        <style>{`
          .spinner-bar {
            animation: spinner-fade ${animationDuration}s linear infinite;
            fill: currentColor;
          }
          @keyframes spinner-fade {
            0% { opacity: 1; }
            100% { opacity: 0.15; }
          }
        `}</style>
        {bars.map((_, i) => (
          <g key={i} transform={`rotate(${i * 45} 50 50)`}>
            <rect
              className="spinner-bar"
              x="45.5"
              y="14"
              rx="4.5"
              ry="4.5"
              width="9"
              height="22"
              style={{ animationDelay: `${(i * animationDuration / bars.length) - animationDuration}s` }}
            >
            </rect>
          </g>
        ))}
      </svg>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};