import type { Schema, Struct } from '@strapi/strapi';

export interface CommonContentArea extends Struct.ComponentSchema {
  collectionName: 'components_common_content_areas';
  info: {
    displayName: 'Content_area';
  };
  attributes: {
    content: Schema.Attribute.RichText;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'common.content-area': CommonContentArea;
    }
  }
}
