import mappings from "./mappings";
import definitions from "./definitions";
import checkComponentsExist from "./component";

interface Widget {
  __component?: string;
  enable_component?: boolean;
  device?: "mobile only" | "desktop only" | string | null;
  [key: string]: any;
}

interface ParamObj {
  widgets?: Widget[];
  pageData?: any;
  [key: string]: any;
}

export default {
  async getWidgetsData(paramObj: ParamObj): Promise<any[] | null> {
    const widgets = paramObj?.widgets;

    await checkComponentsExist(widgets?.map((data) => data?.__component));

    if (!widgets || widgets.length === 0) {
      return null;
    }

    const requestDevice: string | string[] | undefined =
      strapi.requestContext.get().request.headers["device"];

    const structuredWidgets: any[] = [];

    for (const widget of widgets) {
      try {
        if (widget?.enable_component === false) {
          continue;
        }

        if (
          requestDevice &&
          typeof widget?.device !== "undefined" &&
          widget?.device !== null
        ) {
          if (
            requestDevice === "mobile" &&
            widget?.device !== "mobile only"
          ) {
            continue;
          } else if (
            requestDevice === "desktop" &&
            widget?.device !== "desktop only"
          ) {
            continue;
          }
        }

        // clone definitions so each widget gets a fresh copy
        const cloneDefinition = { ...definitions };

        const handlerKey = mappings[widget?.__component ?? ""];

        if (handlerKey && typeof cloneDefinition[handlerKey] === "function") {
          const structuredWidget = await cloneDefinition[handlerKey](
            widget,
            paramObj?.pageData
          );
          structuredWidgets.push(structuredWidget);
        }
      } catch (err) {
        console.error("Error structuring widget:", err);
      }
    }

    return structuredWidgets;
  },
};
