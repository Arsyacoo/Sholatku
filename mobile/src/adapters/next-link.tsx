import React from 'react';

import { useMobileRouter } from '../router';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export interface MobileLinkProps extends Omit<AnchorProps, 'href' | 'onClick'> {
  href: string | URL;
  replace?: boolean;
  prefetch?: boolean;
  scroll?: boolean;
  onClick?: AnchorProps['onClick'];
}

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  return Boolean(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || event.button !== 0);
}

function normalizeHref(href: string | URL): string {
  return typeof href === 'string' ? href : href.toString();
}

const MobileLink = React.forwardRef<HTMLAnchorElement, MobileLinkProps>(function MobileLink(
  { href, replace = false, onClick, target, rel, children, ...props },
  forwardedRef
) {
  const { navigate } = useMobileRouter();
  const normalizedHref = normalizeHref(href);
  const isHashOnly = normalizedHref.startsWith('#');

  return (
    <a
      {...props}
      ref={forwardedRef}
      href={normalizedHref}
      target={target}
      rel={rel}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (target === '_blank' || isModifiedEvent(event) || isHashOnly) return;

        const url = new URL(normalizedHref, window.location.href);
        if (url.origin !== window.location.origin) return;

        event.preventDefault();
        navigate(`${url.pathname}${url.search}${url.hash}`, { replace });
      }}
    >
      {children}
    </a>
  );
});

export default MobileLink;
