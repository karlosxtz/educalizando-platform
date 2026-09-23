'use client';

import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';

type CampaignSurface = 'homepage_campaign' | 'homepage_monthly' | 'homepage_upcoming' | 'calendar';

export default function CampaignTrackedLink({
  href,
  tag,
  surface,
  className,
  children,
  ...props
}: {
  href: string;
  tag: string;
  surface: CampaignSurface;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'>) {
  const recordClick = () => {
    fetch('/api/calendar-campaigns/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, surface }),
      keepalive: true,
    }).catch(() => undefined);
  };

  return <Link href={href} className={className} onClick={recordClick} {...props}>{children}</Link>;
}
