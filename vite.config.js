import { defineConfig, loadEnv } from 'vite';

/**
 * Brand data for the metadata injected into index.html.
 * Kept in one place so the title, the social card and the
 * structured data can never drift apart.
 */
const SITE = {
  name: 'Teela Tech',
  title: 'Teela Tech — Ideas, engineered beautifully.',
  description:
    'Teela Tech is a digital product and software company helping ambitious businesses turn ideas into thoughtful, functional digital experiences. Research × Design × Engineering.',
  image: '/og-image.png',
  imageAlt: 'Teela Tech — Ideas, engineered beautifully.',
  twitterCard: 'summary_large_image',
  themeColor: '#111111',
  address: {
    addressLocality: 'Lagos',
    addressCountry: 'NG',
  },
};

/**
 * Generates the absolute URLs that crawlers and link previews need.
 *
 * The deployment origin comes from VITE_SITE_URL rather than being
 * hard-coded, so a preview deploy and production both emit correct
 * URLs once the variable is set. Without it the absolute tags are
 * omitted and the build says so, because a canonical pointing at
 * the wrong host is worse than no canonical.
 *
 * @param {string} siteUrl
 */
function seoPlugin(siteUrl) {
  const origin = siteUrl.replace(/\/+$/, '');

  return {
    name: 'teela-seo',

    transformIndexHtml() {
      if (!origin) {
        console.warn(
          '\n  teela-seo: VITE_SITE_URL is not set, so canonical, og:url and\n' +
            '  absolute structured-data URLs were skipped. Set VITE_SITE_URL in the\n' +
            '  build environment before deploying.\n'
        );
      }

      const tags = [
        { tag: 'meta', attrs: { name: 'theme-color', content: SITE.themeColor } },
        { tag: 'meta', attrs: { name: 'robots', content: 'index, follow' } },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: SITE.twitterCard },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:title', content: SITE.title },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:description', content: SITE.description },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: SITE.image },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image:alt', content: SITE.imageAlt },
        },
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' } },
      ];

      if (origin) {
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: `${origin}/` } },
          { tag: 'meta', attrs: { property: 'og:url', content: `${origin}/` } },
          {
            tag: 'meta',
            attrs: { property: 'og:image:alt', content: SITE.imageAlt },
          }
        );
      }

      // The image must be absolute: social scrapers will not resolve
      // a relative URL.
      tags.push({
        tag: 'meta',
        attrs: { property: 'og:image', content: origin ? `${origin}${SITE.image}` : SITE.image },
      });

      const organisation = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE.name,
        ...(origin ? { url: `${origin}/`, logo: `${origin}${SITE.image}` } : {}),
        description: SITE.description,
        address: {
          '@type': 'PostalAddress',
          addressLocality: SITE.address.addressLocality,
          addressCountry: SITE.address.addressCountry,
        },
      };

      const website = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE.name,
        ...(origin ? { url: `${origin}/` } : {}),
        description: SITE.description,
        inLanguage: 'en',
      };

      tags.push({
        tag: 'script',
        attrs: { type: 'application/ld+json' },
        children: JSON.stringify([organisation, website]),
      });

      // Returning the descriptors lets Vite inject them into <head>.
      // Returning a string here would replace the whole document.
      return tags;
    },

    /**
     * robots.txt and sitemap.xml need the absolute origin, so they are
     * emitted here rather than committed with a placeholder host that
     * would ship to production.
     */
    generateBundle() {
      if (!origin) return;

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
      });

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          `  <url>\n` +
          `    <loc>${origin}/</loc>\n` +
          `    <changefreq>monthly</changefreq>\n` +
          `    <priority>1.0</priority>\n` +
          `  </url>\n` +
          `</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [seoPlugin((env.VITE_SITE_URL || '').trim())],
  };
});
