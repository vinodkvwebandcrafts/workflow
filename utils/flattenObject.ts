const ignoredColumns: string[] = [
  "createdAt",
  "updatedAt",
  "publishedAt",
  "id",
  "date",
  "createdBy",
  "updatedBy",
  "seo",
  "image",
  "documentId"
];

type FlattenedObject = Record<string, string | number>;

function flattenObject(
  ob: Record<string, any> | null
): FlattenedObject {
  const toReturn: FlattenedObject = {};

  if (!ob) return toReturn;

  for (const key in ob) {
    if (!Object.prototype.hasOwnProperty.call(ob, key)) continue;
    if (ignoredColumns.includes(key)) continue;

    const value = ob[key];

    if (typeof value === "object" && value !== null) {
      const flatObject = flattenObject(value);
      for (const nestedKey in flatObject) {
        if (!Object.prototype.hasOwnProperty.call(flatObject, nestedKey)) continue;
        if (!isNaN(flatObject[nestedKey] as number)) continue;
        if (ignoredColumns.includes(nestedKey)) continue;

        toReturn[`${key}.${nestedKey}`] = flatObject[nestedKey];
      }
    } else if (
      ignoredColumns.includes(key) ||
      typeof value === "boolean" ||
      (typeof value === "string" && value.startsWith("/uploads/"))
    ) {
      continue;
    } else if (value !== null && (typeof value === "string" || typeof value === "number")) {
      toReturn[key] = value;
    }
  }

  return toReturn;
}

export default flattenObject;
