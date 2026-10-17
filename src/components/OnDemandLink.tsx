'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

/** Menus and catalogue lists load a destination when clicked, avoiding unused server renders. */
export default function OnDemandLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={false} />;
}
