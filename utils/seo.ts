import createHelpers, { frontEndUrl, IMAGE_QUERY } from "./index";
import url from "url";
import { Core } from "@strapi/strapi";

interface MetaImage {
  url?: string;
  alternativeText?: string;
  width?: number;
  height?: number;
  caption?: string;
  size?: number;
}

interface MetaSocial {
  id?: number | string;
  socialNetwork?: string;
  title?: string;
  description?: string;
  image?: {
    url?: string | null;
    alternativeText?: string;
  };
}

interface SEOInput {
  id?: number | string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  metaRobots?: string;
  structuredData?: any;
  metaViewport?: string;
  canonicalURL?: string;
  metaImage?: MetaImage;
  metaSocial?: MetaSocial[];
}

interface SEOComponent extends SEOInput {
  metaImage: {
    url: string;
    alternativeText: string;
  };
  metaSocial: MetaSocial[];
}

export interface SeoService {
  getPopulateObject(): Record<string, any>;
  seoStructure(seo: SEOInput): Promise<SEOComponent>;
}

export default function seo(strapi: Core.Strapi): SeoService {
  function getPopulateObject() {
    return {
      populate: {
        metaImage: true,
        structuredData: true,
        metaSocial: {
          populate: {
            image: {
              populate: {
                select: [
                  "url",
                  "alternativeText",
                  "width",
                  "height",
                  "caption",
                  "size",
                ],
              },
            },
          },
        },
      },
    };
  }

  async function seoStructure(seo: SEOInput): Promise<SEOComponent> {
    const defaultOgImage = await strapi.db
      .query("api::common-data.common-data")
      .findOne({
        populate: {
          seo_og_image: IMAGE_QUERY,
        },
      });

    const metaSocial: MetaSocial[] =
      seo?.metaSocial?.map((element) => {
        const img = element?.image
          ? createHelpers(strapi).checkImageExist(element.image)
          : null;

        return {
          id: element?.id,
          socialNetwork: element?.socialNetwork,
          title: element?.title,
          description: element?.description,
          image: {
            url: img?.url ?? null,
            alternativeText:
              element?.image?.alternativeText || "Social Share Image",
          },
        };
      }) || [];

    const generalSettings = await strapi.db
      .query("api::general-site-setting.general-site-setting")
      .findOne({
        select: ["frontend_url"],
        where: {
          publishedAt: { $notNull: true },
        },
      });

    const frontend_url = generalSettings?.frontend_url || frontEndUrl;

    const imgNxtUrl = createHelpers(strapi).getNextGenerateUrl(
      seo?.metaImage || defaultOgImage?.seo_og_image
    );

    const seoComponent: SEOComponent = {
      id: seo?.id,
      metaTitle: seo?.metaTitle,
      metaDescription: seo?.metaDescription,
      keywords: seo?.keywords,
      metaRobots: seo?.metaRobots,
      structuredData: seo?.structuredData,
      metaViewport: seo?.metaViewport,
      canonicalURL: seo?.canonicalURL,
      metaImage: {
        url: url.resolve(frontend_url, imgNxtUrl || ""),
        alternativeText:
          seo?.metaImage?.alternativeText || "Spice Tree Image",
      },
      metaSocial,
    };

    return seoComponent;
  }

  return { getPopulateObject, seoStructure };
}
