/**
 * @file data.ts
 * @description This file contains functions and constants for managing and manipulating K4Item data schemas. It includes functions for migrating data, extracting unique keys and values, generating reports, and building items from data.
 */
import U from "./utilities.js";
import {K4ItemType, K4ItemSubType, K4ItemRange, K4ActorType} from "./enums";
import K4Actor from "../documents/K4Actor.js";
// import K4Item from "../documents/K4Item.js";
import ITEM_DATA from "./item-data.js";
// import PREV_DATA from "../../../.dev/item-data-prev";

// #region TYPES & ENUMS ~
/** Namespace for PACK types */
namespace PACKS {
  export interface ByType {
    [K4ItemType.advantage]: Array<ITEM_DATA.Schema<K4ItemType.advantage>>;
    [K4ItemType.disadvantage]: Array<ITEM_DATA.Schema<K4ItemType.disadvantage>>;
    [K4ItemType.move]: Array<ITEM_DATA.Schema<K4ItemType.move>>;
    [K4ItemType.darksecret]: Array<ITEM_DATA.Schema<K4ItemType.darksecret>>;
    [K4ItemType.relation]: Array<ITEM_DATA.Schema<K4ItemType.relation>>;
    [K4ItemType.gear]: Array<ITEM_DATA.Schema<K4ItemType.gear>>;
    [K4ItemType.weapon]: Array<ITEM_DATA.Schema<K4ItemType.weapon>>;
  }
  export interface SubItems {
    subItems: K4SubItem.Schema[];
    subMoves: K4SubItem.Schema[];
  }
  export interface ParentItems {
    parentItems: Array<ITEM_DATA.Schema<K4Item.Types.Parent>>;
  }
  export interface BasicPlayerMoves {
    basicPlayerMoves: Array<ITEM_DATA.Schema<K4ItemType.move> & Record<string, unknown>>;
  }
  export interface BySubType {
    [K4ItemSubType.activeRolled]: K4SubItem.Schema[];
    [K4ItemSubType.activeStatic]: K4SubItem.Schema[];
    [K4ItemSubType.passive]: ITEM_DATA.Schema[];
  }
  export interface All {
    all: ITEM_DATA.Schema[];
  }
}

type PACKS = PACKS.ByType & PACKS.BySubType & PACKS.SubItems & PACKS.ParentItems & PACKS.BasicPlayerMoves & PACKS.All;

enum ReportOn {
  UniqueValues = "UniqueValues",
  SubTypes = "SubTypes"
}

namespace REPORTS {
  export interface Config {
    isExpanding?: boolean;
    reportType?: ReportOn;
  }

  export interface CountReport {
    count: number;
    total: number;
    schemasWith?: string[];
    schemasWithout?: string[];
  }
}

type AnySchema = ITEM_DATA.Schema | K4SubItem.Schema;
// #endregion

// #REGION === DATA === ~

// #region PACKS Object ~
/** PACKS object containing various item schemas */
const PACKS: PACKS = {
  /** SUBITEM NAMING CONVENTIONS
   *
   * activeRolled -- these moves are rolled, and their name should complete the sentence "X rolls Y to <subItem.name>"
   * activeStatic -- these moves are triggered, and their name should complete the sentence "X proceeds to <subItem.name>"
   * passive -- there should be no passive subItems (they should be parent items)
   *
   * */
  [K4ItemType.advantage]: ITEM_DATA[K4ItemType.advantage],
  [K4ItemType.disadvantage]: ITEM_DATA[K4ItemType.disadvantage],
  [K4ItemType.darksecret]: ITEM_DATA[K4ItemType.darksecret],
  [K4ItemType.weapon]: ITEM_DATA[K4ItemType.weapon],
  [K4ItemType.gear]: ITEM_DATA[K4ItemType.gear],
  [K4ItemType.move]: ITEM_DATA[K4ItemType.move],
  [K4ItemType.relation]: ITEM_DATA[K4ItemType.relation],
  get basicPlayerMoves() {
    return this[K4ItemType.move].toSorted((a, b) => a.name.localeCompare(b.name)) as Array<ITEM_DATA.Schema<K4ItemType.move> & Record<string, unknown>>;
  },
  get parentItems() {
    return [
      ...this[K4ItemType.advantage],
      ...this[K4ItemType.disadvantage],
      ...this[K4ItemType.weapon],
      ...this[K4ItemType.gear]
    ];
  },
  get subItems(): K4SubItem.Schema[] {
    return extractSubItemSchemas([
      ...this[K4ItemType.advantage],
      ...this[K4ItemType.disadvantage],
      ...this[K4ItemType.weapon],
      ...this[K4ItemType.gear]
    ]);
  },
  get subMoves(): K4SubItem.Schema[] {
    return extractSubItemSchemas([
      ...this[K4ItemType.advantage],
      ...this[K4ItemType.disadvantage],
      ...this[K4ItemType.weapon],
      ...this[K4ItemType.gear]
    ], [K4ItemType.move]);
  },
  get all(): ITEM_DATA.Schema[] {
    return [
      ...this[K4ItemType.advantage],
      ...this[K4ItemType.disadvantage],
      ...this[K4ItemType.darksecret],
      ...this[K4ItemType.weapon],
      ...this[K4ItemType.gear],
      ...this[K4ItemType.move]
    ];
  },
  get [K4ItemSubType.activeRolled](): K4SubItem.Schema[] {
    return this.subItems
      .filter((move) => move.system.subType === K4ItemSubType.activeRolled);
  },
  get [K4ItemSubType.activeStatic](): K4SubItem.Schema[] {
    return this.subMoves
      .filter((move) => move.system.subType === K4ItemSubType.activeStatic);
  },
  get [K4ItemSubType.passive](): ITEM_DATA.Schema[] {
    return this.all
      .filter((move) => move.system.subType === K4ItemSubType.passive);
  }
};
// #endregion

//#ENDREGION

// #region Utility & Reporting Functions ~

/**
 * Determines the type of a given value.
 * @param {unknown} val - The value to determine the type of.
 * @returns {string} - The type of the value.
 */
function getType(val: unknown): string {
  if (val === null) { return "null"; }
  if (val === undefined) { return "undefined"; }
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return "[]";
    }
    const uniqueArrayTypes = Array.from(new Set(val.map(getType)));
    if (uniqueArrayTypes.length === 1) {
      return `[${uniqueArrayTypes[0]}]`;
    }
    return `[${uniqueArrayTypes.join(", ")}]`;
  }
  if (typeof val === "object") {
    // Check whether val === {}
    if (Object.keys(val).length === 0) {
      return "{}";
    }
    return "why-didn't-this-parse"
  }

  let isNumString = false;

  if (typeof val === "string") {
    if (val === "") {
      return "empty-string";
    }
    if (!isNaN(Number(val))) {
      val = Number(val);
      isNumString = true;
    } else if (["true", "false"].includes(val.toLowerCase())) {
      return "bool-string";
    } else if (val.includes(' ')) {
      return "phrase-string";
    } else {
      return "word-string";
    }
  }

  switch (typeof val as Omit<typeof val, "string">) {
    case "undefined":
    case "boolean":
    case "function":
    case "object":
    case "symbol":
      return typeof val;
    case "bigint":
    case "number": {
      const typeParts: string[] = [];
      if (val === 0) {
        typeParts.push("0");
      } else {
        typeParts.push(...[
          Math.abs(val as number) < 10
            ? "small-"
            : "",
          val as number > 0
            ? "pos"
            : "neg",
          Number.isInteger(val)
            ? "Int"
            : "Float"
        ]);
      }
      if (isNumString) {
        typeParts.push("-string");
      }
      return typeParts.join("");
    }
    default: {
      throw new Error(`Unknown type: ${typeof val}`);
    }
  }
}

/**
 * Extracts unique keys from an array of item data.
 * @param {Array<ITEM_DATA.Schema|K4SubItem.Schema>} itemDataArray - The array of item data.
 * @param {boolean} [isExpanding=false] - Whether to expand the keys.
 * @returns {Record<string, unknown>} - The unique keys.
 */
function getUniqueSystemKeys(itemDataArray: Array<ITEM_DATA.Schema | K4SubItem.Schema>, isExpanding = false): Record<string, unknown> {
  const uniqueEntries: Array<Tuple<string, string[]>> = [];
  itemDataArray.forEach((item) => {
    const flatSystem = flattenObject(item.system) as Record<string, unknown>;
    Object.keys(flatSystem).forEach((thisKey) => {
      const thisType = getType(flatSystem[thisKey]);
      if (thisType === "object") {
        console.log(`Object found at ${thisKey}: '${JSON.stringify(flatSystem[thisKey])}'`);
      }
      const matchingEntry = uniqueEntries.find((uniqueEntry) => uniqueEntry[0] === thisKey);
      if (matchingEntry) {
        if (!matchingEntry[1].includes(thisType)) {
          matchingEntry[1].push(thisType);
        }
      } else {
        uniqueEntries.push([thisKey, [thisType]]);
      }
    });
  });

  // Iterate through uniqueSubItemEntries, converting the array of types to a string
  const parsedSubItemEntries: Array<Tuple<string>> = uniqueEntries
    .map((entry) => [entry[0], entry[1].join(", ")]);

  // Sort the flattened keys
  parsedSubItemEntries.sort((a, b) => a[0].localeCompare(b[0]));

  // Construct the data object, still with flattened keys
  const dataObject = Object.fromEntries(parsedSubItemEntries);

  return isExpanding ? (expandObject(dataObject) as Record<string, unknown>) : dataObject;
}

/**
 * Gets unique values for a given key from an array of item data.
 * @param {ITEM_DATA.Schema[]} itemDataArray - The array of item data.
 * @param {string} key - The key to get unique values for.
 * @returns {unknown[]}
 */
function getUniqueValuesForSystemKey(itemDataArray: ITEM_DATA.Schema[], key: string): unknown[]
function getUniqueValuesForSystemKey(itemDataArray: ITEM_DATA.Schema[], key: string[]): Record<string, unknown>
function getUniqueValuesForSystemKey(itemDataArray: ITEM_DATA.Schema[], key: ValueOrArray<string>): Record<string, unknown> | unknown[] {
  if (Array.isArray(key)) {
    const valsByKey: Partial<Record<string, unknown[]>> = {};
    key.forEach((thisKey) => {
      valsByKey[thisKey] = getUniqueValuesForSystemKey(itemDataArray, thisKey);
    });
    return valsByKey;
  }
  const uniqueValues: unknown[] = [];
  const isFlattening = key.includes('.');
  itemDataArray.forEach((schema) => {
    const flatSubItemSystem = isFlattening ? (flattenObject(schema.system) as Record<string, unknown>) : schema.system;
    if (key in flatSubItemSystem) {
      let thisValue = flatSubItemSystem[key as keyof typeof flatSubItemSystem];
      if (Array.isArray(thisValue)) {
        thisValue = `[${thisValue.map(String).join(", ")}]`;
      }
      if (!uniqueValues.includes(thisValue)) {
        uniqueValues.push(thisValue);
      }
    }
  });
  return uniqueValues;
}

/**
 * Generates a report of unique keys and their types/values from an array of item data.
 * @param {ITEM_DATA.Schema[]} itemDataArray - The array of item data.
 * @param {boolean} [isExpanding=false] - Whether to expand the keys.
 * @returns {Record<string, string>} - The report object.
 */
function getItemSystemReport(itemDataArray: ITEM_DATA.Schema[] = PACKS.all, options: REPORTS.Config = {}): Record<string, unknown> {

  const VAL_TYPES_TO_LIST = [
    "small-posInt",
    "boolean",
    "word-string",
    "[word-string]"
  ];
  const keyTypeData = getUniqueSystemKeys(itemDataArray);

  let mapFunction: <V>(entry: Tuple<string, unknown>) => Tuple<string, V>;

  options.reportType ??= ReportOn.UniqueValues;

  switch (options.reportType) {
    case ReportOn.UniqueValues:
      mapFunction = <V = string>([key, val]: Tuple<string, unknown>) => [
        key,
        VAL_TYPES_TO_LIST.includes(String(val))
          ? getUniqueValuesForSystemKey(itemDataArray, key).join(", ")
          : val
      ] as Tuple<string, V>;
      break;
    case ReportOn.SubTypes:
      mapFunction = <V = Partial<Record<K4ItemSubType, REPORTS.CountReport>>>([key]: Tuple<string, unknown>) => {
        const returnData = {
          [K4ItemSubType.activeRolled]: countSchemasWithSystemKey(
            itemDataArray.filter((is) => is.system.subType === K4ItemSubType.activeRolled),
            key
          ),
          [K4ItemSubType.activeStatic]: countSchemasWithSystemKey(
            itemDataArray.filter((is) => is.system.subType === K4ItemSubType.activeStatic),
            key
          ),
          [K4ItemSubType.passive]: countSchemasWithSystemKey(
            itemDataArray.filter((is) => is.system.subType === K4ItemSubType.passive),
            key
          )
        };
        [
          K4ItemSubType.activeRolled,
          K4ItemSubType.activeStatic,
          K4ItemSubType.passive
        ].forEach((subType) => {
          if (returnData[subType].count === 0) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete returnData[subType];
          }
        });
        return [key, returnData as V];
      };
      break;
  }

  const reportObject = Object.fromEntries(
    Object.entries(keyTypeData)
      .map(([key, val]) => mapFunction([key, val]))
  );
  return options.isExpanding !== false ? (expandObject(reportObject) as Record<string, unknown>): reportObject;
}

/**
 * Extracts sub-item schemas from an array of item data.
 * @param {ITEM_DATA.Schema[]} itemDataArray - The array of item data.
 * @param {K4SubItem.Types[]} [subTypes=[K4ItemType.move]] - The sub-item types to extract.
 * @returns {Array<K4SubItem.Schema>} - The extracted sub-item schemas.
 */
function extractSubItemSchemas(itemDataArray: ITEM_DATA.Schema[] = PACKS.all, subTypes: K4SubItem.Types[] = [K4ItemType.move]): K4SubItem.Schema[] {
  return itemDataArray
    .filter((item): item is ITEM_DATA.Schema<K4Item.Types.Parent> =>
      [K4ItemType.advantage, K4ItemType.disadvantage, K4ItemType.weapon, K4ItemType.gear]
        .includes(item.type))
    .map((parentItem) => parentItem.system.subItems.filter((subItem) => subTypes.includes(subItem.type)))
    .flat();
}

/**
 * Extracts unique keys from sub-item schemas.
 * @param {ITEM_DATA.Schema[]} itemDataArray - The array of item data.
 * @param {boolean} [isExpanding=false] - Whether to expand the keys.
 * @returns {Record<string, unknown>} - The unique keys.
 */
function getUniqueSubItemSystemKeys(itemDataArray: ITEM_DATA.Schema[] = PACKS.all, isExpanding = false): Record<string, unknown> {
  return getUniqueSystemKeys(
    extractSubItemSchemas(itemDataArray),
    isExpanding
  );
}

function countSchemasWithSystemKey(schemaArray: AnySchema[], key: string): REPORTS.CountReport {
  const schemasWith: string[] = [];
  const schemasWithout: string[] = [];
  const returnData: REPORTS.CountReport = {count: 0, total: schemaArray.length};

  schemaArray.forEach((schema) => {
    const flatSchema = flattenObject(schema.system) as Record<string, unknown>;
    let schemaName: string;
    if (schema.name) {
      schemaName = schema.name;
    } else if ("chatName" in schema.system && schema.system.chatName) {
      schemaName = schema.system.chatName;
    } else if ("id" in schema && schema.id) {
      schemaName = schema.id;
    } else {
      schemaName = `Unknown_${U.randInt(100, 999)}`;
    }
    if (key in flatSchema) {
      schemasWith.push(schemaName);
    } else {
      schemasWithout.push(schemaName);
    }
  });
  if (schemasWithout.length >= schemasWith.length) {
    returnData.schemasWith = schemasWith;
  }
  if (schemasWith.length >= schemasWithout.length) {
    returnData.schemasWithout = schemasWithout;
  }
  returnData.count = schemasWith.length;
  return returnData;
}
/**
 * Get unique values for a sub-item key from an array of item data or a single key or array of keys.
 * @param itemDataArray - Array of item data objects or a single key or array of keys.
 * @param key - A single key or array of keys (optional if the first argument is a key or array of keys).
 * @returns Unique values for the specified key(s).
 */
function getUniqueValuesForSubItemKey(itemDataArray: ITEM_DATA.Schema[], key: string): unknown[];
function getUniqueValuesForSubItemKey(itemDataArray: ITEM_DATA.Schema[], key: string[]): Record<string, unknown[]>;
function getUniqueValuesForSubItemKey(keys: string[]): Record<string, unknown[]>;
function getUniqueValuesForSubItemKey(key: string): unknown[];
function getUniqueValuesForSubItemKey(
  arg1: ValueOrArray<string> | ITEM_DATA.Schema[],
  arg2?: ValueOrArray<string>
): unknown[] | Record<string, unknown[]> {

  // Resolve overload signatures into key and subItemDataArray
  let itemDataArray: ITEM_DATA.Schema[];
  let key: ValueOrArray<string>;
  if (Array.isArray(arg1) && U.isList(arg1[0]) && U.isDefined(arg2)) {
    // arg1 is ITEM_DATA.Schema[], arg2 is a key or array of keys
    itemDataArray = arg1 as ITEM_DATA.Schema[];
    key = arg2;
  } else if (typeof arg1 === "string" || (Array.isArray(arg1) && typeof arg1[0] === "string") && U.isUndefined(arg2)) {
    // arg1 is a single key or array of keys, itemDataArray defaults to PACKS.all
    itemDataArray = PACKS.all;
    key = arg1 as ValueOrArray<string>;
  } else {
    throw new Error(`[getUniqueValuesForSubItemKey] Invalid Parameters: '${String(arg1)}', '${String(arg2)}`);
  }
  const subItemDataArray = extractSubItemSchemas(itemDataArray);
  if (Array.isArray(key)) {
    return Object.entries(
      key.reduce<Record<string, unknown[]>>((acc, thisKey) => {
        acc[thisKey] = getUniqueValuesForSubItemKey(itemDataArray, thisKey);
        return acc;
      }, {})
    );
  }
  return getUniqueValuesForSystemKey(subItemDataArray as ITEM_DATA.Schema[], key);
}
/**
 * Generates a report of unique keys and their types/values from sub-item schemas.
 * @param {ITEM_DATA.Schema[]} itemDataArray - The array of item data.
 * @param {boolean} [isExpanding=false] - Whether to expand the keys.
 * @returns {Record<string, string>} - The report object.
 */
function getSubItemSystemReport(itemDataArray: ITEM_DATA.Schema[] = PACKS.all, options: REPORTS.Config = {}): Record<string, unknown> {
  const VAL_TYPES_TO_LIST = [
    "small-posInt",
    "boolean",
    "word-string",
    "[word-string]"
  ];
  const keyTypeData = getUniqueSubItemSystemKeys(itemDataArray);

  let mapFunction: <V>(entry: Tuple<string, unknown>) => Tuple<string, V>;

  options.reportType ??= ReportOn.UniqueValues;

  const extractedSubItemSchemas = extractSubItemSchemas(itemDataArray);

  switch (options.reportType) {
    case ReportOn.UniqueValues:
      mapFunction = <V = string>([key, val]: Tuple<string, unknown>) => [
        key,
        VAL_TYPES_TO_LIST.includes(String(val))
          ? getUniqueValuesForSubItemKey(itemDataArray, key).join(", ")
          : val
      ] as Tuple<string, V>;
      break;
    case ReportOn.SubTypes:
      mapFunction = <V = Partial<Record<K4ItemSubType, REPORTS.CountReport>>>([key, val]: Tuple<string, unknown>) => {
        const returnData = {
          [K4ItemSubType.activeRolled]: countSchemasWithSystemKey(
            extractedSubItemSchemas.filter((is) => (is.system.subType as K4ItemSubType) === K4ItemSubType.activeRolled),
            key
          ),
          [K4ItemSubType.activeStatic]: countSchemasWithSystemKey(
            extractedSubItemSchemas.filter((is) => (is.system.subType as K4ItemSubType) === K4ItemSubType.activeStatic),
            key
          )
        };
        ([
          K4ItemSubType.activeRolled,
          K4ItemSubType.activeStatic
        ] as const).forEach((subType) => {
          if (returnData[subType].count === 0) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete returnData[subType];
          }
        });
        return [key, returnData as V];
      };
      break;
  }

  const reportObject = Object.fromEntries(
    Object.entries(keyTypeData)
      .map(([key, val]) => mapFunction([key, val]))
  );
  return options.isExpanding !== false ? (expandObject(reportObject) as Record<string, unknown>) : reportObject;
}

// function getMutationDiffReport() {
//   return diffObject(PREV_DATA, ITEM_DATA);
// }
// #endregion

// #REGION BUILDING ITEMS FROM DATA ~
/**
 * Parses item schemas for creation by pruning keys and setting folder names.
 * @param {any[]} itemDataArray - The array of item data.
 * @returns {any[]} - The parsed item schemas.
 */
function parseItemSchemasForCreation(itemDataArray: ITEM_DATA.Schema[] = PACKS.all): Array<foundry.abstract.Document.ConstructorDataFor<typeof K4Item>> {
  const FOLDER_NAME_MAP = {
    [K4ItemType.advantage]: "Advantages",
    [K4ItemType.disadvantage]: "Disadvantages",
    [K4ItemType.darksecret]: "Dark Secrets",
    [K4ItemType.relation]: null,
    [K4ItemType.weapon]: "Weapons & Gear",
    [K4ItemType.gear]: "Weapons & Gear",
    [K4ItemType.move]: "Basic Player Moves",
    [K4ItemType.gmtracker]: null
  };
  return itemDataArray
    .map((itemData) => {
      const newItemData = foundry.utils.duplicate(itemData) as ITEM_DATA.Schema & {folder: string|null};
      ["_id", "folder", "sort", "permission", "flags"]
        .forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newItemData[key as keyof typeof newItemData]
      });
      if (FOLDER_NAME_MAP[itemData.type]) {
        newItemData.folder = getGame().folders.getName(FOLDER_NAME_MAP[itemData.type]!)?.id ?? null;
      }
      return newItemData as foundry.abstract.Document.ConstructorDataFor<typeof K4Item>;
    });
}

/**
 * Builds items from data by deleting existing items and creating new ones.
 * @returns {Promise<void>}
 */
async function BUILD_ITEMS_FROM_DATA(): Promise<void> {
  const itemSchemas = parseItemSchemasForCreation(PACKS.all);

  function clearActorItems(actor: K4Actor): Promise<unknown> {
    // Filter actor's items to exclude K4SubItems, as their removal is taken care of by their parent item
    const mainItems: K4Item[] = actor.items.filter((i: K4Item) => !i.isSubItem());
    // Delete all the remaining items
    return Promise.all(mainItems.map((item) => item.delete()));
  }
  function clearActorEffects(actor: K4Actor): Promise<unknown> {
    return actor.deleteEmbeddedDocuments("ActiveEffect", Array.from(actor.effects.keys()));
  }
  async function clearActor(actor: K4Actor) {
    await clearActorItems(actor);
    await clearActorEffects(actor);
    return undefined;
  }

  function clearAllActors(): Promise<unknown> {
    const myActors = getActors(); // <-- Resolves to 'any'
    return Promise.all(myActors.map((actor) => clearActor(actor)));
  }

  // Await a Promise.all that deletes all the existing items
  await Promise.all([
    clearAllActors(),
    Promise.all(getItems().map((item) => item.delete()))
  ]);

  // Create all the new items
  await K4Item.create(itemSchemas)

  // Initialize each actor with a new set of basic moves
  await Promise.all(getActors().map((actor) => actor.initMovesAndEffects()));
}

//#endregion

// #REGION === ANALYSIS ===
/**
 * Analyzes items to find a subset where each key used by any item has at least one non-empty value across the subset.
 * @param items Array of items to analyze.
 * @returns Array of items forming the representative subset.
 */
function findRepresentativeSubset(items: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  /**
   * Helper function to determine if a value is non-empty.
   * @param value The value to check.
   * @returns True if the value is non-empty, false otherwise.
   */
  function isNonEmpty(value: unknown): boolean {
      return value !== "" && value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0) && value !== 0;
  }

  // Object to store the reason each item was included in the representative set
  const inclusionReasons: Record<string, string> = {};

  // Flatten each item and collect keys with non-empty values
  const keyMap = new Map<string, Record<string, unknown>>();

  items.forEach(item => {
      const flatItem = flattenObject(item) as Record<string, unknown>;
      Object.entries(flatItem).forEach(([key, value]) => {
          if (isNonEmpty(value)) {
              if (!keyMap.has(key)) {
                  keyMap.set(key, item);
                  inclusionReasons[item.name as string] = key;
              }
          }
      });
  });

  // Collect unique items that together cover all non-empty keys
  const representativeSubset = Array.from(new Set(keyMap.values()));

  // Log the inclusion reasons to the console
  console.log("Inclusion Reasons:", inclusionReasons);

  return representativeSubset;
}

/**
 * Checks if a subset of items covers all keys with non-empty values in the master set.
 * @param subset Array of items forming the representative subset.
 * @param masterSet Array of all items to analyze.
 * @returns True if the subset covers all keys with non-empty values in the master set, false otherwise.
 */
function checkSubsetCoverage(subset: Array<Record<string, unknown>>, masterSet: Array<Record<string, unknown>>): boolean {
  /**
   * Helper function to determine if a value is non-empty.
   * @param value The value to check.
   * @returns True if the value is non-empty, false otherwise.
   */
  function isNonEmpty(value: unknown): boolean {
      return value !== "" && value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0) && value !== 0;
  }

  // Flatten each item in the subset
  const flattenedSubset = subset.map(item => flattenObject(item) as Record<string, unknown>);

  // Iterate through each item in the master set
  for (const masterItem of masterSet) {
      const flatMasterItem = flattenObject(masterItem) as Record<string, unknown>;

      // Check if every key with a non-empty value in the master item is covered by at least one item in the subset
      for (const [key, value] of Object.entries(flatMasterItem)) {
          if (isNonEmpty(value)) {
              const isCovered = flattenedSubset.some(flatSubsetItem => isNonEmpty(flatSubsetItem[key]));
              if (!isCovered) {
                  console.log(`Key "${key}" with value "${String(value)}" in master item "${String(masterItem.name)}" is not covered by the subset.`);
                  return false;
              }
          }
      }
  }

  return true;
}

/**
 * Finds unique keys for each item in the subset.
 * @param subset Array of items forming the representative subset.
 * @param allItems Array of all items to analyze.
 * @returns Object where each key is an item name and the value is an array of keys that no other items share.
 */
function findUniqueKeys(subset: Array<Record<string, unknown>>, allItems: Array<Record<string, unknown>>): Record<string, string[]> {
  /**
   * Helper function to determine if a value is non-empty.
   * @param value The value to check.
   * @returns True if the value is non-empty, false otherwise.
   */
  function isNonEmpty(value: unknown): boolean {
      return value !== "" && value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0) && value !== 0;
  }

  // Flatten each item in the entire dataset
  const flattenedAllItems = allItems.map(item => flattenObject(item) as Record<string, unknown>);

  // Collect all keys and their occurrences across the entire dataset
  const keyOccurrences = new Map<string, number>();

  flattenedAllItems.forEach(flatItem => {
      Object.entries(flatItem).forEach(([key, value]) => {
          if (isNonEmpty(value)) {
              if (!keyOccurrences.has(key)) {
                  keyOccurrences.set(key, 0);
              }
              keyOccurrences.set(key, keyOccurrences.get(key)! + 1);
          }
      });
  });

  // Flatten each item in the subset
  const flattenedSubset = subset.map(item => flattenObject(item) as Record<string, unknown>);

  // Find unique keys for each item in the subset
  const uniqueKeysRecord: Record<string, string[]> = {};

  subset.forEach((item, index) => {
      const itemName = item.name as string;
      const flatItem = flattenedSubset[index];
      const uniqueKeys: string[] = [];

      Object.entries(flatItem).forEach(([key, value]) => {
          if (isNonEmpty(value) && keyOccurrences.get(key) === 1) {
              uniqueKeys.push(key);
          }
      });

      uniqueKeysRecord[itemName] = uniqueKeys;
  });

  return uniqueKeysRecord;
}
// #ENDREGION

export {
  BUILD_ITEMS_FROM_DATA,
  PACKS,
  getUniqueValuesForSystemKey,
  getItemSystemReport,
  getSubItemSystemReport,
  // getMutationDiffReport,
  findRepresentativeSubset,
  checkSubsetCoverage,
  findUniqueKeys
}
