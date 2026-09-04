import React from 'react';
import * as LucideIcons from 'lucide-react';
import { AlertCircle } from 'lucide-react';

export interface SafeIconProps extends LucideIcons.LucideProps {
  name: string;
}

export function SafeIcon({ name, ...props }: SafeIconProps) {
  // Try to find the icon by name in the lucide-react exports
  const IconComponent = (LucideIcons as any)[name];

  // If the icon exists, render it
  if (IconComponent) {
    return <IconComponent {...props} />;
  }

  // If it doesn't exist, log a warning (only in development) and render a fallback
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[SafeIcon] Icon "${name}" does not exist in lucide-react.`);
  }

  // Fallback to a warning icon with a slight red tint to make it obvious
  return (
    <span title={`Missing icon: ${name}`}>
      <AlertCircle {...props} className={props.className ? `${props.className} text-red-400` : 'text-red-400'} />
    </span>
  );
}
