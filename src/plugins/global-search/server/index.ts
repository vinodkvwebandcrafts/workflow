import routes from './routes';
import searchController from './controllers/search';

export default {
  register({ strapi }) {
    strapi.plugin('global-search').controllers = {
      search: searchController({ strapi }),
    };
  },

  bootstrap() {},

  routes: {
    'content-api': routes, // 👈 important in v5
  },
};
