"use strict";

import mappings from "./mappings";
import definitions from "./definitions";
import checkComponentsExist from "./component";
import { ParamObj, Widget } from "./interface";

type DefinitionFn = (widget: Widget, pageData?: any) => Promise<any> | any;

type Definitions = Record<string, DefinitionFn>;

export default {
  async getWidgetsData(paramObj: ParamObj): Promise<any[] | null> {
    let widgets = paramObj?.widgets;

    await checkComponentsExist(widgets?.map((data) => data?.__component));

    if (!widgets || widgets.length <= 0) {
      return null;
    }

    const requestDevice = strapi.requestContext.get().request.headers["device"];

    const structuredWidgets: any[] = [];

    for (const widget of widgets) {
      try {
        if (widget?.enable_component === false) {
          continue;
        }

        if (requestDevice && widget?.device !== undefined && widget?.device !== null) {
          if (requestDevice === "mobile" && widget.device !== "mobile only") {
            continue;
          } else if (requestDevice === "desktop" && widget.device !== "desktop only") {
            continue;
          }
        }

        const cloneDefinition: Definitions = { ...definitions };

        const definitionKey = mappings[widget?.__component];

        if (!definitionKey || !cloneDefinition[definitionKey]) {
          continue;
        }

        const structuredWidget = await cloneDefinition[definitionKey](
          widget,
          paramObj?.pageData
        );

        structuredWidgets.push(structuredWidget);
      } catch (err) {
        console.error("Error in getWidgetsData:", err);
      }
    }

    return structuredWidgets;
  },
};
