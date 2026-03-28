import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sortPostsByDateDesc } from '../utils/posts';

export const GET: APIRoute = async ({ site }) => {
  const PAGE_SIZE = 10;
  const basePath = import.meta.env.BASE_URL || '/';
  const siteOrigin = site?.toString() ?? 'http://127.0.0.1:4321';
  const urlFor = (path: string) => new URL(path, siteOrigin).toString();

  const staticEntries = [
    { loc: urlFor(basePath), lastmod: new Date().toISOString() },
    { loc: urlFor(`${basePath}about/`), lastmod: new Date().toISOString() },
    { loc: urlFor(`${basePath}bio/`), lastmod: new Date().toISOString() },
    { loc: urlFor(`${basePath}rss.xml`), lastmod: new Date().toISOString() },
  ];

  const posts = sortPostsByDateDesc(await getCollection('posts', ({ data }) => !data.draft));
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const postEntries = posts.map((post) => ({
    loc: urlFor(`${basePath}posts/${post.slug}/`),
    lastmod: post.data.publishDate.toISOString(),
  }));

  const pageEntries = totalPages > 1
    ? Array.from({ length: totalPages - 1 }, (_, idx) => ({
        loc: urlFor(`${basePath}page/${idx + 2}/`),
        lastmod: posts[0]?.data.publishDate.toISOString() ?? new Date().toISOString(),
      }))
    : [];

  const allEntries = [...staticEntries, ...pageEntries, ...postEntries];
  const urlset = allEntries
    .map(
      (entry) => `<url>
  <loc>${entry.loc}</loc>
  <lastmod>${entry.lastmod}</lastmod>
</url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
