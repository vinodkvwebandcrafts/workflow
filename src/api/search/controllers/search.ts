/**
 * search controller
 */

import { Core, factories } from '@strapi/strapi'

export default factories.createCoreController('api::search.search' as any, ({ strapi }: { strapi: Core.Strapi }) => ({
  async globalSearch(ctx: any) {
    const query = ctx.query.q || '';

    if (!query) {
      return {};
    }

    // List your content types here
    const contentTypes = [
      'api::url-mapper.url-mapper',
    ];

    const results: any[] = [];

    for (const uid of contentTypes) {
      const entries = await strapi.db.query(uid).findMany({
        select: ['id', 'url', 'title', 'description'],
        where: {
          $or: [
            // { title: { $containsi: query } },
            // { description: { $containsi: query } },
            { content: { $containsi: query } },
          ],
          // publishedAt: {
          //   $not: null,
          // },
        },
        limit: 5,
      });

      if (entries.length > 0) {
        results.push(...entries)
      }
    }

    return { data: results };
  },
}));
