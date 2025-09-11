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
      'api::service.service',
    ];

    const results: any[] = [];

    for (const uid of contentTypes) {
      const entries = await strapi.db.query(uid).findMany({
        where: {
          $or: [
            { title: { $containsi: query } },
            { description: { $containsi: query } },
            { content: { $containsi: query } },
          ],
          publishedAt: {
            $not: null,
          },
        },
        limit: 5,
      });

      const model = strapi.contentTypes[uid];
      const sanitizedEntries = await strapi.contentAPI.sanitize.output(entries, model);

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
