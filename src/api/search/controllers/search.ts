/**
 * search controller
 */

import { Core, factories } from '@strapi/strapi'

export default factories.createCoreController('api::search.search', ({ strapi }: { strapi: Core.Strapi }) => ({
  async globalSearch(ctx: any) {
    const query = ctx.query.q || '';

    if (!query) {
      return { data: [] };
    }

    // List your content types here
    const contentTypes = [
      'api::blog.blog',
    ];

    const results: any[] = [];

    for (const uid of contentTypes) {
      const entries = await strapi.db.query(uid).findMany({
        where: {
          $or: [
            { title: { $containsi: query } },
            { description: { $containsi: query } },
          ],
          publishedAt: {
            $not: null,
          },
        },
        limit: 5,
      });

      const sanitizedEntries = await strapi.contentAPI.sanitize.output(entries, uid, { auth: false });

      if (entries.length > 0) {
        results.push(
          {
            contentType: uid, 
            entries
          }
        );
      }
    }

    return { data: results };
  },
}));
