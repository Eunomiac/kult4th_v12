import U from "../scripts/utilities.js";
import K4Actor from "./K4Actor.js";
import K4Item from "./K4Item.js";
import K4ChatMessage from "./K4ChatMessage.js";


function formatForKult(str: string, iData: foundry.abstract.Document.Any|{system: K4Item.SystemSchema.Any|K4Actor.SystemSchema.Any}) {


  // Step One: Replace any data object references.
  str = str.replace(
    /%([^%.]+)\.([^%]+)%/g,
    (_, sourceRef: string, dataKey: string): string => {
    // kLog.log(`[formatForKult: '${sourceRef}']`, {str, iData, sourceRef, dataKey}, 3);
    switch (sourceRef) {
      case "list": {
        const  listItems = U.getProp<string[]>(iData, `system.lists.${dataKey}.items`);
        if (!listItems) {
          return `<span style='color: red;'>No Such List: ${dataKey}</span>`;
        }
        return [
          `<ul class='inline-list list-${dataKey}'>`,
          ...listItems.map((item) => `<li>${item}</li>`),
          "</ul>"
        ].join("");
      }
      case "insert": {
        switch (dataKey) {
          case "break": {
            return "<br /><br />";
          }
          case "rollPrompt": {
            const attribute = U.getProp<string>(iData, "system.attribute");
            if (!attribute) {
              return `<span style='color: red;'>No Such Attribute: ${dataKey}</span>`;
            }
            return [
              "#>text-attributename>",
              "roll ",
              `+${attribute ? U.tCase(attribute) : "Attribute"}`,
              "<#"
            ].join("");
          }
          default: {
            let actor: Maybe<K4Actor> = undefined;
            if (iData instanceof K4Item && iData.isOwned && iData.parent instanceof K4Actor) {
              actor = iData.parent;
            } else if (iData instanceof K4Actor) {
              actor = iData as K4Actor;
            } else if (iData instanceof K4ChatMessage) {
              actor = iData.actor;
            }
            if (dataKey.startsWith("actor")) {
              if (!actor) {
                return `<span style='color: red;'>Could Not Resolve Actor for ${dataKey}</span>`;
              }
              const dotKey = dataKey.slice(6);
              kLog.log(`[formatForKult] With dataKey '${dataKey}', actor '${actor.name}' and dotKey '${dotKey}', returning: '${U.getProp<string>(actor, dotKey) ?? ""}'`)
              return U.getProp(actor, dotKey) ?? "";
            }
            if (/^(doc|roll)Link/.test(dataKey)) {
              let [docName, docDisplay] = dataKey.split(".").slice(1) as Array<Maybe<string>>;
              let doc: Maybe<K4Item> = undefined;
              if (actor) {
                doc = actor.items.getName(docName ?? "");
              } else {
                doc = getGame().items.getName(docName ?? "");
              }
              if (!doc) {
                return `<span class="text-docLink" data-doc-name="${docName}" data-action="open">${docName}</span>`;
              }
              docDisplay ??= doc.name;
              if (dataKey.startsWith("docLink")) {
                return `<span class="text-docLink" data-doc-id="${doc.id}" data-doc-name="${doc.name}" data-action="open">${docDisplay}</span>`;
              }
              return `<span class="text-rollLink" data-doc-id="${doc.id}" data-doc-name="${doc.name}" data-action="roll">${docDisplay}</span>`;
            }
            if (dataKey.startsWith("FLAGS")) {
              const [_, effectID, ...flagKeyParts] = dataKey.split(".");
              const flagKey = flagKeyParts.join(".");
              if (!actor) {
                throw new Error("Cannot access flags from a non-actor item");
              }
              const effect = actor.effects.get(effectID as IDString);
              if (!effect) {
                throw new Error(`No such effect: ${effectID}`);
              }

              return effect.flagGet(flagKey)!;
            }
            return `<span style='color: red;'>No Such Prompt: ${dataKey}</span>`;
          }
        }
      }
      default: return `<span style='color: red;'>No Such Source: ${sourceRef}.${dataKey}</span>`;
    }
  });

  // Step Two: Apply span styling.
  // str = str.replace(/Check: /g, "CHECK"); // Remove the colon from 'Check:' moves, to avoid confusing the replacer
  let prevStr;
  while (str !== prevStr) {
    prevStr = str;
    str = str.replace(/#>([^>&]+)(&[^>]+)?>([^#]+)<#/g, (_, classRefs: Maybe<string>, attrRefs: Maybe<string>, contents: Maybe<string>) => {
      classRefs = ["text-tag", classRefs ?? ""].join(" ").trim();
      const htmlParts = [
        "<span class='",
        classRefs,
        "'"
      ];
      if (attrRefs) {
        htmlParts.push(attrRefs.replace(/&/g, " "));
      }
      htmlParts.push(">");
      // if (classRefs.includes("chat-select")) {
      //   htmlParts.push("<span class='selection-key'></span>");
      // }
      htmlParts.push(...[
        contents ?? "",
        "</span>"
      ]);
      return htmlParts.join("");
    });
  }
  // str = str.replace(/CHECK/g, "Check: ");

  // Step Three: Apply final specific fixes to formatting
  // str = str
  //   .replace(/([\s\t\n]*<p>[\s\t\n]*<\/p>[\s\t\n]*)+/g, "<p></p>") // Remove empty <p> elements, except when used as breaks
  //   .replace(/^<p>[\s\t\n]*<\/p>|<p>[\s\t\n]*<\/p>$/g, ""); // Remove empty <p> elements at start and end of code block

  return str;
}



const getProp = <T>(obj: object, key: string): Maybe<T> => foundry.utils.getProperty(obj, key) as Maybe<T>;
// it's just most commonly needed by custom DocumentSheets
class K4TextEditor extends TextEditor {

  static override async enrichHTML(htmlContent: string, options?: Partial<TextEditor.EnrichmentOptions>): Promise<string> {

    /* === [1] RUN CUSTOM PRE-ENRICHMENT PATTERNS === */

    const customPatterns: string[] = [

    ];
    await Promise.resolve(customPatterns);
    return  htmlContent;
  }

  // async getData() {
  //   const context = super.getData();
  //   // htmlContent might be `this.document.system.description` or some other similar path
  //   context.enrichedDescription = await TextEditor.enrichHTML(
  //     this.document.system.description,
  //     {
  //       // Only show secret blocks to owner
  //       secrets: this.document.isOwner,
  //       async: true,
  //       // For Actors and Items
  //       rollData: this.document.getRollData
  //     }
  //   );
  //   return context;
  // }
}