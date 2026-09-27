/**
 * vite/seo.mjs
 *
 * Search-engine files for the production build:
 * - fills %SITE_URL% in index.html (canonical link, share preview tags)
 * - writes robots.txt and sitemap.xml next to the built site
 * - adds Google Search Console's verification tag when GOOGLE_SITE_VERIFICATION is set
 *
 * The site address comes from the host automatically (Vercel or Netlify), or
 * from SITE_URL if you set it yourself — so nothing needs editing when the domain changes.
 */

function resolveSiteUrl () {
  const url = process.env.SITE_URL
    // Vercel: the project's production domain (e.g. weather-now.vercel.app)
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    // Netlify: the site's main address
    || process.env.URL
    || 'http://localhost:3000'
  return url.replace(/\/+$/, '')
}

export default function seo () {
  let siteUrl
  let isBuild = false

  return {
    name: 'weather-seo',

    configResolved (config) {
      isBuild = config.command === 'build'
      siteUrl = resolveSiteUrl()
      if (isBuild && siteUrl.startsWith('http://localhost')) {
        config.logger.warn('[seo] No site address found — set SITE_URL, or build on Vercel/Netlify. Using localhost for now.')
      }
    },

    transformIndexHtml (html) {
      let result = html.replaceAll('%SITE_URL%', siteUrl)

      const verification = process.env.GOOGLE_SITE_VERIFICATION
      if (verification) {
        result = result.replace(
          '</head>',
          `  <meta name="google-site-verification" content="${verification.replace(/"/g, '')}">\n  </head>`,
        )
      }
      return result
    },

    generateBundle () {
      const today = new Date().toISOString().slice(0, 10)

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      })
    },
  }
}
