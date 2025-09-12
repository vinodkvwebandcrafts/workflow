/**
 * blog service
 */

import { factories } from '@strapi/strapi';
import queryProcessor from '../../../../utils/queryProcessor';

export default factories.createCoreService('api::blog.blog', ({ strapi }) => ({
    async findOne(slug: String) {
    const populate: any = {
        widgets: {
            on: {
                'common.content-area': {
                    populate: {
                        content: true,
                    },
                },
            },
        },
    };
    const data = await strapi.documents('api::blog.blog').findFirst({
        select: ['url', 'title', 'description'],
        where: { url: slug as string },
        populate
    } as const);

    console.log('data==', data)

    if (!data) {
      return null;
    }

    const parsedData = await queryProcessor({ strapi }).getCommonResponse(data);
    return data as any;
  },
}));
