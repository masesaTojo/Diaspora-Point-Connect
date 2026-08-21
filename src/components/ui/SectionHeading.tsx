import React from 'react';
import { cn } from '@/src/lib/utils';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({ title, subtitle, align = 'left', className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-10", align === 'center' ? 'text-center' : 'text-left', className)}>
      <h2 className="text-3xl md:text-4xl font-display font-bold text-navy mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
