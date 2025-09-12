/**
 * blog controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::blog.blog', ({ strapi }) => ({
//   async find(ctx) {
//     return await strapi.service('api::blog.blog').find(ctx);
//   },
  async findOne(ctx) {
    const url = ctx.request.url
    const slug = url.split('/').pop()
    return await strapi.service('api::blog.blog').findOne(slug as String);
  },
}));
