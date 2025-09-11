import type { Schema, Struct } from '@strapi/strapi';

export interface HomepageBannerItem extends Struct.ComponentSchema {
  collectionName: 'components_homepage_banner_items';
  info: {
    displayName: 'Banner_item';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'homepage.banner-item': HomepageBannerItem;
    }
  }
}
