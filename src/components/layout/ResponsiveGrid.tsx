import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: number; // e.g. 280 for doctor cards
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = 280,
  gap = 'var(--space-md, 1rem)',
  className = ''
}) => {
  return (
    <div
      className={`grid w-full ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minItemWidth}px), 1fr))`,
        gap
      }}
    >
      {children}
    </div>
  );
};
