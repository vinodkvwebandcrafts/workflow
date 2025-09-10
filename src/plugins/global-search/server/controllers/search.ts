import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async index(ctx) {
        const results = await strapi
            .plugin('global-search')
            .service('search')
            .search(ctx.request.query.q);

        ctx.body = results;

  },
});
