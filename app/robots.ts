import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    // Set NEXT_PUBLIC_SITE_URL in production for an absolute sitemap URL.
    sitemap: siteUrl ? new URL('/sitemap.xml', siteUrl).toString() : '/sitemap.xml',
  };
}
