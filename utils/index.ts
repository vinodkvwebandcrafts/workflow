// src/utils/helpers.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
import _ from "lodash";
import { parse as parseHtml } from "node-html-parser";
import axios from "axios";
import type { Core } from "@strapi/strapi";

export const IMAGE_QUERY = {
  select: [
    "url",
    "alternativeText",
    "width",
    "height",
    "caption",
    "size",
    "mime",
    "id",
  ],
};

export const SINGLE_TYPE = "singleType";
export const COLLECTION_TYPE = "collectionType";

export const URL_SUFFIXES = {
  EXPERIENCE: "experiences/",
};
export const baseUrl = (strapi.config.get("app.settings.base_url") as string) || "";
export const frontEndUrl = (strapi.config.get("app.settings.front_end_url") as string) || "";

type AnyObj = Record<string, any>;

export default function createHelpers(strapi: Core.Strapi) {

  return {
    IMAGE_QUERY,
    SINGLE_TYPE,
    COLLECTION_TYPE,
    URL_SUFFIXES,
    baseUrl,
    frontEndUrl,

    checkImageExist(img?: AnyObj | null) {
      if (!img) return null;
      const mimeType = typeof img?.mime === "string" ? img.mime.split("/")[0] : null;
      const resolvedUrl = (() => {
        try {
          // if img.url is absolute already, URL will handle it
          return new URL(img.url, baseUrl).toString();
        } catch {
          return `${baseUrl}${img.url ?? ""}`;
        }
      })();

      return {
        id: img.id,
        type: mimeType,
        url: resolvedUrl,
        alternativeText:
          img?.alternativeText || "A featured image for this section",
      };
    },

    checkFileExist(file?: AnyObj | null) {
      if (!file) return "";
      return { url: baseUrl + (file.url ?? "") };
    },

    checkImageExistArray(imgArray?: AnyObj[] | null) {
      if (!Array.isArray(imgArray) || imgArray.length === 0) return "";
      return imgArray.map((element) => ({
        url: baseUrl + (element?.url ?? ""),
        alternativeText: element?.alternativeText,
        width: element?.width,
        height: element?.height,
        caption: element?.caption,
      }));
    },

    getNextGenerateUrl(image?: { url?: string } | null) {
      const imgUrl = image?.url;
      if (!imgUrl) return null;
      if (imgUrl.startsWith("_next/")) return imgUrl;
      return `_next/image?url=${encodeURIComponent(`${baseUrl}/${imgUrl}`)}&w=1200&q=90`;
    },

    async parseHtmlLinks(contents: string | null) {
      if (!contents) return null;
      try {
        const htmlObj = parseHtml(contents);

        htmlObj.getElementsByTagName("img").forEach((tag) => {
          tag.setAttribute("src", tag.getAttribute("src") ?? "");
          tag.removeAttribute("srcset");
        });

        htmlObj.getElementsByTagName("video").forEach((tag) => {
          tag.setAttribute("src", tag.getAttribute("src") ?? "");
        });

        htmlObj.getElementsByTagName("a").forEach((aTag) => {
          const aUrl = aTag.getAttribute("href");
          if (!aUrl) return;

          try {
            // absolute URL detection
            const parsed = new URL(aUrl, baseUrl);
            const absolute = parsed.toString();

            if (absolute.startsWith(baseUrl)) {
              // convert to path-only relative URL
              const newUrl = parsed.pathname.replace(/^\/+/, ""); // remove leading /
              aTag.setAttribute("href", newUrl);
            } else {
              // external link -> open in new tab
              aTag.setAttribute("target", "_blank");
            }
          } catch {
            // malformed or relative URL — leave as-is
          }
        });

        htmlObj.querySelectorAll(".upload-url").forEach((file) => {
          const aUrl = file.getAttribute("href");
          if (aUrl) {
            file.setAttribute("href", baseUrl + aUrl);
          }
        });

        return htmlObj.toString();
      } catch (error) {
        strapi.log.error("parseHtmlLinks error:", error);
        return null;
      }
    },

    async recaptchaVerification(token?: string): Promise<boolean> {
      if (!token) return false;
      try {
        const response = await axios.post(
          "https://www.google.com/recaptcha/api/siteverify",
          null,
          {
            params: {
              secret: process.env.RECAPTCHA_SECRET_KEY,
              response: token,
            },
          }
        );
        return response.data?.success === true;
      } catch (err) {
        strapi.log.error("reCAPTCHA validation error:", err);
        return false;
      }
    },

    getImageUrl(img?: AnyObj | null) {
      return img ? `${baseUrl}${img.url ?? ""}` : null;
    },

    getImageAltText(img?: AnyObj | null) {
      return img?.alternativeText || "A featured image for this section";
    },

    async revalidate() {
      try {
        const revalidateUrl = await strapi.db
          .query("api::general-site-setting.general-site-setting")
          .findOne({
            select: ["url"],
            where: { publishedAt: { $notNull: true } },
          });

        const urlToCall = revalidateUrl?.url;
        if (!urlToCall) {
          strapi.log.error("Revalidation URL not found or invalid.");
          return;
        }

        // use axios so we are consistent
        const response = await axios.get(urlToCall);
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Revalidation failed with status: ${response.status}`);
        }
        strapi.log.info(`Revalidation successful: ${response.status}`);
      } catch (error) {
        strapi.log.error("Error during revalidation:", error);
      }
    },

    async createOrGetFolders(folderName: string) {
      if (!folderName) throw new Error("folderName is required");
      const existingFolder = await strapi.db
        .query("plugin::upload.folder")
        .findOne({ where: { name: { $eq: folderName } } });

      if (existingFolder) return existingFolder;

      const newFolderData = await strapi.db
        .query("plugin::upload.folder")
        .create({ data: { name: folderName } });

      return strapi.db.query("plugin::upload.folder").update({
        where: { id: newFolderData.id },
        data: {
          path: `/${newFolderData.id}`,
          pathId: newFolderData.id,
        },
      });
    },

    /**
     * saveFile
     * - file: an object with fields { path, name, type, size } (e.g. multer/Strapi upload)
     * - foldername: folder (string)
     */
    async saveFile(file: AnyObj | null, foldername: string) {
      if (!file) return false;
      if (!foldername) throw new Error("foldername is required");

      const folder = await this.createOrGetFolders(foldername);

      const dbPath = `/uploads/${foldername}`;
      const storePath = path.join(process.cwd(), "public", dbPath); // safer join
      const originalFileName = file.name;

      const hash = crypto.randomBytes(20).toString("hex");
      const hashName = `${hash}_${originalFileName}`;
      const dbSavePath = `${dbPath}/${hashName}`;
      const checkPath = path.join(storePath, hashName);

      if (!fs.existsSync(storePath)) {
        fs.mkdirSync(storePath, { recursive: true });
      }

      // synchronous read/write for predictable lifecycle behavior
      const buffer = fs.readFileSync(file.path);
      fs.writeFileSync(checkPath, buffer, { mode: 0o644 });

      const ext = path.extname(originalFileName);

      const fileData = {
        name: originalFileName,
        alternativeText: originalFileName,
        caption: originalFileName,
        folder,
        folderPath: `/${folder?.id}`,
        url: dbSavePath,
        hash: hashName,
        ext,
        mime: file?.type,
        size: file?.size ?? null,
      };

      return strapi.db.query("plugin::upload.file").create({ data: fileData });
    },
  };
}
