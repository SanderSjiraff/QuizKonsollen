import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-body overflow-hidden">
      <div className="max-w-[1920px] mx-auto min-h-screen relative">
        {children}
      </div>
    </div>
  );
}
