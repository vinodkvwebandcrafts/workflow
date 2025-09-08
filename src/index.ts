// import type { Core } from '@strapi/strapi';

import { Core } from "@strapi/strapi";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const afterCreate = async () => {
      // await strapi.db.query("plugin::users-permissions.user").create({
      //   data: {
      //     email: "admin@example.com",
      //     password: "123456",
      //     username: "admin",
      //     role: "admin",
      //   },
      // });
    }
  },
};
