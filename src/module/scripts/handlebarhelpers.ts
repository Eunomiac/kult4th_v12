// #region IMPORTS ~
import C from "./constants.js";
import U from "./utilities.js";
import SVGDATA, {SVGKEYMAP} from "./svgdata.js";
import K4Actor from "../documents/K4Actor.js";
import K4Item from "../documents/K4Item.js";
import { formatForKult } from "./helpers.js";
// #endregion


type ContextType = K4Item | {
  data: {
    root: {
      document?: K4Item|K4Actor;
      item?: K4Item;
    }
  }
} | {
  data: {
    root: K4Item.System;
  };
};

const handlebarHelpers: Record<string,Handlebars.HelperDelegate> = {
  /**
   * Handlebars helper that allows defining local variables (like #with), but without changing the context. Can define multiple variables in one call (see example).
   * @param {Object} options - The options object provided by Handlebars.
   * @returns {string} - The rendered block with access to the defined local variables.
   * @example
   * // In your Handlebars template:
   * {{#let
   *   anchorName=(uniqueAnchorName 'occupation')
   *   title="Occupation"
   *   suggestions=occupationSuggestions
   * }}
   *   ... HTML with above variables added to scope ...
   * {{/let}}
   */
  "let"(options: Handlebars.HelperOptions): string {
    // Merge the current context with the hash arguments
    const context = { ...this, ...options.hash };
    // Execute the block with the new context, but keep the original context as `this`
    return options.fn(context);
  },
  /**
   * Handlebars helper to perform various comparison operations.
   * @param {unknown} param1 - The first parameter for comparison.
   * @param {string} operator - The comparison operator.
   * @param {unknown} param2 - The second parameter for comparison.
   * @returns {boolean} - The result of the comparison.
   */
  "test"(param1: unknown, operator: string, param2: unknown): boolean {
    const isStringOrNumber = (a: unknown): a is string | number => typeof a === "number" || typeof a === "string";

    if (["!", "!!", "not"].includes(param1 as string)) {
      ([param1, operator] = [operator, param1 as string]);
    }

    switch (operator) {
      case "!":
      case "!!":
      case "not":
        return !param1;
      case "==":
      case "===":
        return param1 === param2;
      case "!=":
      case "!==":
        return param1 !== param2;
      case ">":
        return U.isNumber(param1) && U.isNumber(param2) && param1 > param2;
      case "<":
        return U.isNumber(param1) && U.isNumber(param2) && param1 < param2;
      case ">=":
        return U.isNumber(param1) && U.isNumber(param2) && param1 >= param2;
      case "<=":
        return U.isNumber(param1) && U.isNumber(param2) && param1 <= param2;
      case "includes":
        return Array.isArray(param1) && param1.includes(param2);
      case "in":
        if (Array.isArray(param2)) { return param2.includes(param1); }
        if (U.isList(param2) && isStringOrNumber(param1)) { return param1 in param2; }
        if (typeof param2 === "string") { return new RegExp(String(param2), "gu").test(String(param1)); }
        return false;
      default:
        return false;
    }
  },
  "case"(mode: StringCase, str: string) {
    // return U[`${mode.charAt(0)}Case`](str);
    switch (mode) {
      case "upper": return U.uCase(str);
      case "lower": return U.lCase(str);
      case "sentence": return U.sCase(str);
      case "title": return U.tCase(str);
      default: return str;
    }
  },
  "count"(param: unknown): number {
    if (Array.isArray(param) || U.isList(param)) {
      return Object.values(param).length;
    }
    return param ? 1 : 0;
  },
  "signNum"(num: number) {
    return U.signNum(num);
  },
  "areEmpty"(...args) {
    args.pop();
    return !Object.values(args).flat().join("");
  },
  "getUniqueID"(base: string) {
    return `${base}-${U.getID()}`;
  },
  "getDropCap"(content: Maybe<string>): string {
    if (!content?.length) {
      return "";
    }
    return `systems/${C.SYSTEM_ID}/assets/chat/dropcaps/${content.slice(0, 1).toUpperCase()}.png`;
  },
  "getRestCaps"(content: string): string {
    return content.slice(1);
  },
  "kLog"(...args: Tuple<string|number>) {
    args.pop();
    let dbLevel = 5;
    if ([0,1,2,3,4,5].includes(args[0] as number)) {
      dbLevel = args.shift() as number;
    }
    kLog.hbsLog(...(args.map(String) as Tuple<string>), dbLevel);
  },
  "formatForKult"(str: string, context: ContextType) {
    let iData: Maybe<{system: K4Item.SystemSchema.Any|K4Actor.SystemSchema.Any}> = undefined;
    if (context instanceof K4Item) {
      iData = context;
    } else if ("document" in context.data.root) {
      iData = context.data.root.document!;
    } else if ("item" in context.data.root) {
      iData = context.data.root.item!;
    } else {
      iData = {system: context.data.root as K4Item.SystemSchema.Any|K4Actor.SystemSchema.Any};
    }
    // kLog.log("[formatForKult]", {str, context, iData, "this": this});

    return formatForKult(
      str,
      iData
    );
  },
  "getImgName": U.toKey,
  "getSVGs"(ref: string) {
    const isReporting = ref === "ten-sided-die";
    ref = U.toKey(ref) ;
    if (!(ref in SVGDATA) && ref in SVGKEYMAP) {
      ref = SVGKEYMAP[ref];
    }
    if (isReporting) {
      kLog.log("Get Die SVG", {ref, svgData: SVGDATA[ref]});
    }
    const pathData = U.getKey(ref, SVGDATA)
      ?.map((pData) => {
        pData = {
          ...pData,
          style: [
            pData.style ?? "",
            "transform: translate(-50%, -50%)",
            `scale(${pData.scale})`,
            `translate(${pData.xShift}px, ${pData.yShift}px);`
          ].join(" ").trim()
        };
        if (typeof pData.viewBox === "number") {
          pData.viewBox = `0 0 ${pData.viewBox} ${pData.viewBox}`;
        } else if (Array.isArray(pData.viewBox)) {
          pData.viewBox = `0 0 ${pData.viewBox.join(" ")}`;
        } else if (typeof pData.viewBox !== "string") {
          pData.viewBox = "0 0 512 512";
        }
        return pData;
      });

    if (pathData) {
      return pathData;
    }

    throw new Error(`No such SVG path: '${String(ref)}'`);
  },
  "stringify": (ref: Record<string, unknown>): string => JSON.stringify(ref, null, 2)
};

export default handlebarHelpers;