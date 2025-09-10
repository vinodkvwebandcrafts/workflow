import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.db.lifecycles.subscribe(async (event) => {
      const { model, action, result } = event;

      if(event.action === 'afterCreate') {

        const ct = strapi.contentType(model.uid as any);
        
        if (model.uid === 'api::url-mapper.url-mapper') return;

        if(!ct) return;

        if(!result.title) return;

        if(!result.url) return;

        if(ct?.kind === 'singleType') {
          const title = result.title;
          const description = result.description;
          const url = result.slug;
          await strapi.documents('api::url-mapper.url-mapper').create({
            data: {
              title,
              description,
              url,
              type: 'single',
              cid: result.id,
              uid: model.uid,
            },
          });
        }
                
        if(ct?.kind === 'collectionType') {
          const title = result?.title;
          const description = result?.description;
          const url = result?.url;
          const cid = result?.documentId;
          const uid = model?.uid;
          const existing = await strapi.db.query('api::url-mapper.url-mapper').findOne({
            where: {
              cid,
            },
          })
          if(existing) return;
          await strapi.documents('api::url-mapper.url-mapper').create({
            data: {
              title,
              description,
              url,
              type: 'collection',
              cid,
              uid,
            },
          });
        }

      }

      if(event.action === 'afterUpdate') {

        if (model.uid === 'api::url-mapper.url-mapper') return;

        const data = await strapi.db.query('api::url-mapper.url-mapper').findOne({
          where: {
            cid: result?.documentId,
          },
        })

        if(!data) return;

        const published = await strapi.db.query(model.uid).findOne({
          where: {
            documentId: result?.documentId,
            publishedAt: {
              $not: null,
            }
          },
        })

        console.log('published==', published)
        
        const updated = await strapi.db.query('api::url-mapper.url-mapper').update({
          where: {
            cid: result?.documentId,
          },
          data: {
            title: result?.title,
            description: result?.description,
            url: result?.url,
            published: !!published?.publishedAt ? true : false,
          },
        })
        console.log('updated==', updated)
      }

    });
  },

  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};