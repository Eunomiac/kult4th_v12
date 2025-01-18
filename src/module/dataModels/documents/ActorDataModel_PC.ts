import {Archetypes} from "../../scripts/constants";
import {K4Attribute, K4Archetype, ArchetypeTier, K4ActorType, K4ItemType, K4Stability} from "../../scripts/enums";
import AttributeModel from "../AttributeModel";
import ConditionModel from "../ConditionModel";
import WoundModel from "../WoundModel";
import RollModModel from "../RollModModel";
import { ValueMaxField } from "./Fields/UtilityFields";
import { ModDefField } from "./Fields/RollFields";
import { CharGenField } from "./Fields/ActorFields";
import K4Item from "../../documents/K4Item";
import U from "../../scripts/utilities";
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ActorSchema_PC = {
  archetype: new fields.StringField({
    required: true,
    blank: false,
    choices: () => {
      // Get Setting data defining available archetypes
      return Object.fromEntries(Object.entries(Archetypes)
        .filter(([_, {tier}]) => [ArchetypeTier.asleep, ArchetypeTier.aware].includes(tier))
        .map(([val, {label}]) => [val, label]));
    },
    initial: K4Archetype.sleeper,
    label: "Archetype",
    validate: (value: string) => {
      if (!(value in Archetypes)) {
        return false;
      }
    },
    validationError: "is not a valid archetype"
  }),
  description: new fields.HTMLField({label: "Description"}),
  occupation: new fields.StringField({required: true, label: "Occupation"}),
  looks: new fields.SchemaField({
    clothes: new fields.HTMLField({label: "Clothes"}),
    face: new fields.HTMLField({label: "Face"}),
    eyes: new fields.HTMLField({label: "Eyes"}),
    body: new fields.HTMLField({label: "Body"})
  }),
  history: new fields.HTMLField({label: "History"}),
  notes: new fields.HTMLField({label: "Notes"}),
  gmnotes: new fields.HTMLField({
    required: true,
    blank: true,
    initial: "",
    label: "GM Notes"
  }),
  charGen: CharGenField(),
  dramaticHooks: new fields.ArrayField(
    new fields.SchemaField({
      value: new fields.StringField({
        required: true,
        blank: true,
        initial: ""
      }),
      isChecked: new fields.BooleanField({required: true,initial: false})
    }),
    {
      required: true,
      initial: []
    }
  ),
  attributes: new fields.SchemaField(
    Object.fromEntries(
      Object.values(K4Attribute)
        .filter((attr) => ![K4Attribute.ask, K4Attribute.zero].includes(attr))
        .map((attr) => [attr, ValueMaxField(0, -5, 7, U.tCase(attr))])
    )
  ),
  wounds: new fields.ArrayField(
    new fields.EmbeddedDataField(WoundModel)
  ),
  conditions: new fields.ArrayField(
    new fields.EmbeddedDataField(ConditionModel)
  ),
  modifiers: new fields.SchemaField({
    wounds_serious: new fields.ArrayField(ModDefField()),
    wounds_critical: new fields.ArrayField(ModDefField()),
    wounds_seriouscritical: new fields.ArrayField(ModDefField()),
    stability: new fields.ArrayField(ModDefField())
  }),
  stability: ValueMaxField(10, 0, 10),
  edges: new fields.SchemaField({
    sourceName: new fields.StringField({required: true, initial: ""}),
    value: new fields.NumberField({required: true, initial: 0, step: 1, min: 0, max: 3, integer: true})
  }, {required: false, nullable: true}),
  isSheetLocked: new fields.BooleanField({required: true, initial: false}),
}

interface ActorDerivedData_PC {
  moves: K4ItemOfType<K4ItemType.move>[]
  basicMoves: K4ItemOfType<K4ItemType.move>[]
  derivedMoves: K4ItemOfType<K4ItemType.move>[]
  derivedEdges: K4ItemOfType<K4ItemType.move>[]
  activeEdges: K4ItemOfType<K4ItemType.move>[]
  advantages: K4ItemOfType<K4ItemType.advantage>[]
  disadvantages: K4ItemOfType<K4ItemType.disadvantage>[]
  darkSecrets: K4ItemOfType<K4ItemType.darksecret>[]
  weapons: K4ItemOfType<K4ItemType.weapon>[]
  gear: K4ItemOfType<K4ItemType.gear>[]
  relations: K4ItemOfType<K4ItemType.relation>[]
  derivedItems: K4ItemOfType<K4ItemType.move>[]

  maxWounds: {serious: number, critical: number, total: number}
  wounds_serious: WoundModel[]
  wounds_critical: WoundModel[]
  wounds_serious_unstabilized: WoundModel[]
  wounds_critical_unstabilized: WoundModel[]
  wounds_serious_stabilized: WoundModel[]
  wounds_critical_stabilized: WoundModel[]
  enabledUnstabilizedWounds: {serious: WoundModel[], critical: WoundModel[]}
  woundsIcon: string
  woundsModData: RollModModel[]

  enabledConditions: ConditionModel[]
  stabilityConditions: ConditionModel[]
  enabledStabilityConditions: ConditionModel[]
  stabilityModData: RollModModel[]
  stabilityConditionModData: RollModModel[]
  stabilityLevel: K4Stability

  attributeData: AttributeModel[]
  attributes: Record<K4Attribute, number>

  // enabledEffects: K4ActiveEffect[]
  // customChanges: K4Change[]
  // enabledCustomChanges: K4Change[]
  // promptForDataChanges: K4Change[]
  // requireItemChanges: K4Change[]
  // systemChanges: K4Change[]
  // modifyRollChanges: K4Change[]
  // collapsibleRollChanges: K4Change[]
  // toggleableEffects: K4ActiveEffect[]

  collapsedRollModifiers: RollModModel[]


  armor: number
}

export default class ActorDataModel_PC extends TypeDataModel<typeof ActorSchema_PC, Actor.ConfiguredInstance, EmptyObject, InterfaceToObject<ActorDerivedData_PC>> {
  static override defineSchema(): typeof ActorSchema_PC {
    return ActorSchema_PC;
  }

  // statusBarEffects: K4ActiveEffect[] = [];
  /**
     * Prepares data specific to player characters.
     */
  override prepareDerivedData() {
    super.prepareDerivedData();
    this.moves = this.parent.getItemsOfType(K4ItemType.move)
      .sort((a, b) => a.name.localeCompare(b.name));
    this.basicMoves = this.moves.filter((move) => move.isBasicMove());
    this.derivedMoves = this.moves.filter((move): move is K4ItemOfType<K4ItemType.move> => move.isSubItem())
      .filter((subItem) => !subItem.isEdge());
    this.derivedEdges = this.moves.filter((move): move is K4ItemOfType<K4ItemType.move> => move.isEdge());
    this.activeEdges = (() => {
      if (!this.parent.isType(K4ActorType.pc)) {return [];}
      if (!this.edges.sourceName) {return [];}
      if (!this.edges.value) {return [];}
      return this.derivedEdges
        .filter((edge): this is K4ActorOfType<K4ActorType.pc> => (edge.system.parentItem as Maybe<Item>)?.name === this.edges.sourceName);
    })();
    this.advantages = this.parent.getItemsOfType(K4ItemType.advantage);
    this.disadvantages = this.parent.getItemsOfType(K4ItemType.disadvantage);
    this.darkSecrets = this.parent.getItemsOfType(K4ItemType.darksecret);
    this.weapons = this.parent.getItemsOfType(K4ItemType.weapon);
    this.gear = this.parent.getItemsOfType(K4ItemType.gear);
    this.relations = this.parent.getItemsOfType(K4ItemType.relation);
    this.derivedItems = this.parent.items.filter((item: K4Item): item is K4ItemOfType<K4ItemType.move> => item.isSubItem());

    this.maxWounds = {
      serious: this.modifiers.wounds_serious.length,
      critical: this.modifiers.wounds_critical.length,
      total: (this.modifiers.wounds_serious.length + this.modifiers.wounds_critical.length)
    };


    this.gear = this.parent.getItemsOfType(K4ItemType.gear); // return type K4ItemOfType<K4ItemType.gear>[]
    this.armor = 1 + this.gear.reduce((acc, gear) => acc + (gear.system.armor ?? 0), 0);


    if ((this.stability.value ?? 0) > (this.stability.max ?? 10)) {
      this.stability.value = this.stability.max;
    }
    if ((this.stability.value ?? 10) < (this.stability.min ?? 0)) {
      this.stability.value = this.stability.min;
    }


    // get wounds_serious() {return Object.values(this.wounds).filter((wound) => wound && !wound.isCritical);}
    // get wounds_critical() {return Object.values(this.wounds).filter((wound) => wound?.isCritical);}
    // get wounds_serious_unstabilized() {return this.wounds_serious.filter((wound) => wound && !wound.isStabilized);}
    // get wounds_critical_unstabilized() {return this.wounds_critical.filter((wound) => wound && !wound.isStabilized);}
    // get wounds_serious_stabilized() {return this.wounds_serious.filter((wound) => wound?.isStabilized);}
    // get wounds_critical_stabilized() {return this.wounds_critical.filter((wound) => wound?.isStabilized);}
    // get enabledUnstabilizedWounds() {
    //   const enabledUnstabilizedWounds: Record<K4WoundType.serious|K4WoundType.critical, K4Actor.Components.Wound[]> = {
    //     [K4WoundType.serious]: [],
    //     [K4WoundType.critical]: [],
    //   };
    //   Object.values(this.wounds)
    //     .filter((wound): wound is K4Actor.Components.Wound => Boolean(wound))
    //     .filter((wound) => !wound.isStabilized && wound.isApplyingToRolls)
    //     .forEach((wound) => {
    //       enabledUnstabilizedWounds[wound.isCritical ? K4WoundType.critical : K4WoundType.serious].push(wound);
    //     });
    //   return enabledUnstabilizedWounds;
    // }
    // get woundsIcon(): string {
    //   if (!this.isType(K4ActorType.pc)) {return "";}
    //   const numSerious = this.enabledUnstabilizedWounds.serious.length;
    //   const numCritical = this.enabledUnstabilizedWounds.critical.length;
    //   if (numCritical) { return "systems/kult4th/assets/icons/wounds/wound-critical.svg"; }
    //   if (numSerious) { return "systems/kult4th/assets/icons/wounds/wound-serious.svg"; }
    //   return "";
    // }
    // get enabledConditions(): K4Actor.Components.Condition[] {
    //   return Object.values(this.conditions)
    //     .filter((condition): condition is K4Actor.Components.Condition => Boolean(condition?.isApplyingToRolls));
    // }
    // get stabilityConditions(): K4Actor.Components.Condition[] {
    //   if (!this.isType(K4ActorType.pc)) {return [];}
    //   return Object.values(this.system.conditions)
    //     .filter((condition) => condition.type === K4ConditionType.stability);
    // }
    // get enabledStabilityConditions(): K4Actor.Components.Condition[] {
    //   return this.stabilityConditions.filter((condition) => condition.isApplyingToRolls);
    // }
    // get woundModData(): K4Roll.ModData[] {
    //   if (!this.isType(K4ActorType.pc)) {return [];}
    //   const numSerious = this.wounds_serious_unstabilized.filter((wound) => wound?.isApplyingToRolls).length;
    //   const numCritical = this.wounds_critical_unstabilized.filter((wound) => wound?.isApplyingToRolls).length;
    //   const numBoth = Math.min(numSerious, numCritical);
    //   if (numSerious + numCritical === 0) { return []; }
    //   let woundModDefinitions: K4Roll.ModDefinition = {};
    //   let tooltipLabel = "";
    //   let tooltipDesc = "";
    //   if (numBoth) {
    //     woundModDefinitions = this.system.modifiers.wounds_seriouscritical[numBoth];
    //     tooltipLabel = "Grievously Wounded";
    //     tooltipDesc = "Your many grievous injuries threaten death if not treated, even as the pain brings you closer than ever before to piercing the Illusion.";
    //   } else if (numCritical) {
    //     woundModDefinitions = this.system.modifiers.wounds_critical[numCritical];
    //     tooltipLabel = "Critically Wounded";
    //     tooltipDesc = "You are critically wounded, greatly limiting your ability to act. If you do not receive medical attention soon, death is assured.";
    //   } else if (numSerious) {
    //     woundModDefinitions = this.system.modifiers.wounds_serious[numSerious];
    //     tooltipLabel = "Wounded";
    //     tooltipDesc = "Your untreated injuries hamper your ability to act."
    //   }
    //   const modData: K4Roll.ModData[] = [];
    //   for (const [filter, value] of Object.entries(woundModDefinitions)) {
    //     modData.push({
    //       id: `wound-${filter}`,
    //       filter,
    //       value,
    //       name: "Wounds",
    //       tooltip: [
    //         `<h2>${tooltipLabel}</h2>`,
    //         `<p>${tooltipDesc}</p>`
    //       ].join(""),
    //       cssClasses: ["k4-theme-red"]
    //     });
    //   }
    //   return modData;
    // }
    // get stabilityModData(): K4Roll.ModData[] {
    //   if (!this.isType(K4ActorType.pc)) {return [];}
    //   const stabilityModDefinitions = this.system.modifiers.stability[this.stability];
    //   let tooltipLabel = "";
    //   let tooltipDesc = "";
    //   switch (this.stabilityLevel) {
    //     case K4Stability.broken:
    //       tooltipLabel = "Broken";
    //       tooltipDesc = "You are broken, unable to act or even think clearly. You are at the mercy of your surroundings.";
    //       break;
    //     case K4Stability.critical:
    //       tooltipLabel = "Critical Stress";
    //       tooltipDesc = "You are critically unstable, your mind teetering on the brink of madness. You are barely able to act, and your thoughts are consumed by your instability.";
    //       break;
    //     case K4Stability.serious:
    //       tooltipLabel = "Serious Stress";
    //       tooltipDesc = "You are seriously unstable, your thoughts and actions hindered by your instability.";
    //       break;
    //     case K4Stability.moderate:
    //       tooltipLabel = "Moderate Stress";
    //       tooltipDesc = "You are moderately unstable, your thoughts and actions occasionally hindered by your instability.";
    //       break;
    //     case K4Stability.composed:
    //       return [];
    //   }
    //   const modData: K4Roll.ModData[] = [];
    //   for (const [filter, value] of Object.entries(stabilityModDefinitions)) {
    //     modData.push({
    //       id: `stability-${filter}`,
    //       filter,
    //       value,
    //       name: "Stability",
    //       tooltip: [
    //         `<h2>${tooltipLabel}</h2>`,
    //         `<p>${tooltipDesc}</p>`
    //       ].join(""),
    //       cssClasses: ["k4-theme-red"]
    //     });
    //   }
    //   return modData;
    // }
    // get stabilityConditionModData(): K4Roll.ModData[] {
    //   if (!this.isType(K4ActorType.pc)) {return [];}
    //   const modData: K4Roll.ModData[] = [];
    //   for (const condition of this.enabledStabilityConditions) {
    //     const modDefinitions = condition.modDef;
    //     for (const [filter, value] of Object.entries(modDefinitions)) {
    //       modData.push({
    //         id: `stability-condition-${condition.id}-${filter}`,
    //         filter,
    //         value,
    //         name: condition.label,
    //         tooltip: [
    //           `<h2>${condition.label}</h2>`,
    //           `<p>${condition.description}</p>`
    //         ].join(""),
    //         cssClasses: ["k4-theme-blue"]
    //       });
    //     }
    //   }
    //   return modData;
    // }
    // get statusBarStrips(): HoverStripData[] {
    //   const woundStrips: HoverStripData[] = Object.values(this.wounds)
    //     .filter((wound): wound is K4Actor.Components.Wound => Boolean(wound))
    //     .map((strip) => {
    //       const stripData: HoverStripData = {
    //         id: strip.id,
    //         icon: "systems/kult4th/assets/icons/wounds/",
    //         type: [
    //           strip.isStabilized ? "stable" : "",
    //           strip.isCritical ? "critical" : "serious"
    //         ].join("") as K4WoundType,
    //         display: strip.label,
    //         stripClasses: ["wound-strip"],
    //         dataTarget: `system.wounds.${strip.id}.label`,
    //         placeholder: "(description)  ",
    //         buttons: [
    //           {
    //             icon: "data-retrieval",
    //             dataset: {
    //               target: strip.id,
    //               action: "reset-wound-name"
    //             },
    //             tooltip: "RENAME"
    //           },
    //           {
    //             icon: "wound-serious-stabilized",
    //             dataset: {
    //               target: strip.id,
    //               action: "toggle-wound-stabilize"
    //             },
    //             tooltip: strip.isStabilized ? "REOPEN" : "STABILIZE"
    //           },
    //           {
    //             icon: "hover-strip-button-suppress",
    //             dataset: {
    //               target: strip.id,
    //               action: "suppress-wound"
    //             },
    //             tooltip: strip.isApplyingToRolls ? "SUPPRESS" : "ENABLE"
    //           }
    //         ]
    //       };
    //       if (strip.isCritical) {
    //         stripData.icon += `wound-critical${strip.isStabilized ? "-stabilized" : ""}.svg`;
    //         stripData.stripClasses.push("wound-critical");
    //       } else {
    //         stripData.icon += `wound-serious${strip.isStabilized ? "-stabilized" : ""}.svg`;
    //       }
    //       if (strip.isStabilized) {
    //         stripData.stripClasses.push("k4-theme-gold", "wound-stabilized");
    //       } else {
    //         stripData.stripClasses.push("k4-theme-red");
    //       }
    //       if (strip.isApplyingToRolls) {
    //         stripData.stripClasses.push("strip-enabled");
    //       } else {
    //         stripData.stripClasses.push("strip-disabled");
    //       }
    //       if (this.isType(K4ActorType.pc) && !this.system.isSheetLocked) {
    //         stripData.buttons.push({
    //           icon: "hover-strip-button-drop",
    //           dataset: {
    //             "wound-id": strip.id,
    //             action: "drop"
    //           },
    //           tooltip: "DROP"
    //         });
    //       }

    //       return stripData;
    //     });
    //   const conditionStrips: HoverStripData[] = Object.values(this.conditions)
    //     .filter((condition): condition is K4Actor.Components.Condition => Boolean(condition))
    //     .map((strip) => {
    //       const stripData: HoverStripData = {
    //         id: strip.id,
    //         icon: `systems/kult4th/assets/icons/conditions/${strip.type}.svg`,
    //         type: strip.type,
    //         display: strip.label,
    //         stripClasses: ["condition-strip", `${strip.type}-strip`, "k4-theme-blue"],
    //         dataTarget: `system.conditions.${strip.id}.label`,
    //         placeholder: "(description)  ",
    //         tooltip: strip.description,
    //         buttons: [
    //           {
    //             icon: "data-retrieval",
    //             dataset: {
    //               target: strip.id,
    //               action: "reset-wound-name"
    //             },
    //             tooltip: "RENAME"
    //           },
    //           {
    //             icon: "hover-strip-button-suppress",
    //             dataset: {
    //               target: strip.id,
    //               action: "suppress-condition"
    //             },
    //             tooltip: strip.isApplyingToRolls ? "SUPPRESS" : "ENABLE"
    //           }
    //         ]
    //       };
    //       if (strip.isApplyingToRolls) {
    //         stripData.stripClasses.push("strip-enabled");
    //       } else {
    //         stripData.stripClasses.push("strip-disabled");
    //       }
    //       if (this.isType(K4ActorType.pc) && !this.system.isSheetLocked) {
    //         stripData.buttons.push({
    //           icon: "hover-strip-button-drop",
    //           dataset: {
    //             "condition-id": strip.id,
    //             action: "drop"
    //           },
    //           tooltip: "DROP"
    //         });
    //       }
    //       return stripData;
    //     });

    //   return [
    //     ...woundStrips,
    //     ...conditionStrips
    //   ].sort((a, b) => {
    //     const order = ["wound-critical", "wound-serious"];
    //     if (a.icon.includes(order[0]) && b.icon.includes(order[0])
    //       || a.icon.includes(order[1]) && b.icon.includes(order[1])) {
    //       return 0;
    //     }
    //     if (a.icon.includes(order[0])) { return -1; }
    //     if (b.icon.includes(order[0])) { return 1; }
    //     if (a.icon.includes(order[1])) { return -1; }
    //     if (b.icon.includes(order[1])) { return 1; }
    //     return 0;
    //   })
    // }
    // get stability() {
    //   if (!this.isType(K4ActorType.pc)) {return 0;}
    //   const pcData: K4Actor.System<K4ActorType.pc> = this.system;
    //   return pcData.stability.value;
    // }
    // get stabilityLevel(): K4Stability {
    //   /**
    //    * @todo Replace this with customizable stability levels in settings, and/or variant stability rule
    //    */
    //   if (!this.isType(K4ActorType.pc)) {return K4Stability.composed;}
    //   return [
    //     K4Stability.broken,
    //     K4Stability.broken,
    //     K4Stability.critical,
    //     K4Stability.critical,
    //     K4Stability.critical,
    //     K4Stability.serious,
    //     K4Stability.serious,
    //     K4Stability.serious,
    //     K4Stability.moderate,
    //     K4Stability.moderate,
    //     K4Stability.composed
    //   ][this.stability];
    // }


    // get attributeData(): K4AttributeData[] {


    //   if (this.isType(K4ActorType.pc)) {
    //     const attrList = [...Object.keys(C.Attributes.Passive), ...Object.keys(C.Attributes.Active)] as K4CharAttribute[];
    //     const pcData: K4Actor.System<K4ActorType.pc> = this.system;
    //     return attrList.map((attrName): K4AttributeData => {
    //       const {min, max, value} = pcData.attributes[attrName];
    //       const selectList = Array.from({ length: max - min + 1 }, (_, i) => ({
    //         value: min + i,
    //         label: U.signNum(min + i)
    //       })).sort((a, b) => a.value - b.value);
    //       return {
    //         name: U.tCase(attrName),
    //         key: attrName,
    //         min,
    //         max,
    //         value,
    //         selectList
    //       };
    //     });
    //   }
    //   return [];
    // }
    // /**
    //  * Retrieves a record of character attributes with their corresponding values.
    //  * @returns {Record<K4CharAttribute, number>} A record mapping each attribute to its integer value.
    //  */
    // get attributes(): Record<K4CharAttribute, number> {
    //   const attributeMap: Record<K4CharAttribute, number> = {} as Record<K4CharAttribute, number>;
    //   this.attributeData.forEach((aData) => {
    //     attributeMap[aData.key] = aData.value as Maybe<number> ?? 0;
    //   });
    //   return attributeMap;
    // }


    // get enabledEffects() {
    //   return this.effects.filter((effect) => effect.isEnabled);
    // }
    // get customChanges() {
    //   return Array.from(this.effects)
    //     .map((effect) => effect.getCustomChanges())
    //     .flat();
    // }
    // get enabledCustomChanges() {
    //   return this.customChanges.filter((change) => change.isEnabled);
    // }
    // get promptForDataChanges() {
    //   return this.enabledCustomChanges.filter((change) => change.isPromptOnCreate);
    // }
    // get requireItemChanges() {
    //   return this.enabledCustomChanges.filter((change) => change.isRequireItemCheck);
    // }
    // get systemChanges() {
    //   return this.enabledCustomChanges.filter((change) => change.isSystemModifier);
    // }
    // get modifyRollChanges() {
    //   return this.enabledCustomChanges.filter((change) => change.isRollModifier());
    // }
    // get collapsibleRollChanges() {
    //   return this.modifyRollChanges.filter((change) => change.isCollapsible());
    // }

    // get toggleableEffects() {
    //   return this.effects.filter((effect) => effect.canToggle());
    // }

    // Call all 'system change' custom functions.
    // this.parent.systemChanges.forEach((change) => { void change.apply(this) });

    // this.statusBarEffects = this.parent.effects.filter((effect) => effect.eData.inStatusBar && effect.isNonZero);


    /**
     * Iterates over all active roll modifiers with numeric values and combines them as concisely as possible into a list for display on the actor's sheet, sorted with the most specific modifiers first.
     *
     * e.g. Given an array of the following modifiers:
     * [
     *  {filter: "all", value: 2},
     *  {filter: "advantage", value: 1},
     *  {filter: "disadvantage", value: -1},
     *  {filter: "Keep It Together", value: 3},
     *  {filter: "Involuntary Medium", value: 2},
     *  {filter: "Engage In Combat", value: -2}
     * ];
     * ... and, knowing that:
     * - "Keep It Together" and "Engage in Combat" are a basic moves
     * - "Involuntary Medium" is a disadvantage move
     *
     * the method would return:
     * [
     *   {display: "Keep It Together", value: 5}, (all + Keep It Together)
     *   {display: "Involuntary Medium", value: 3}, (all + disadvantage + Involuntary Medium)
     *   {display: "Other Disadvantages", value: -1}, (all + disadvantage) ('other', to indicate this has already been accounted for in the 'Involuntary Medium' disadvantage total)
     *   {display: "Advantages", value: 3}, (all + advantage) (no 'other', since there are no more-specific Advantage modifiers in the list)
     *   {display: "All Other Rolls", value: 2} (all)
     * ]
     * (Note that it does NOT include "Engage in Combat", as when combined with "all", its modifier sums to zero.)
    //  */
    // get collapsedRollModifiers(): Array<{
    //   display: string,
    //   tooltip: string,
    //   value: number,
    //   othering: Array<"all" | K4ItemClass.Rollable>,
    //   category: "all" | "type" | K4ItemClass.Rollable,
    //   filter: string
    // }> {

    //   const collapsedModifierData: Array<{
    //     display: string,
    //     value: number,
    //     othering: Array<"all" | K4ItemClass.Rollable>,
    //     category: "all" | "type" | K4ItemClass.Rollable,
    //     filter: string
    //   }
    //   > = [];


    //   const categoryVals = {
    //     all: 0,
    //     [K4ItemType.advantage]: 0,
    //     [K4ItemType.disadvantage]: 0
    //   };
    //   const moveTypeRecord: Record<string, K4ItemClass.Rollable> = {};
    //   const statusBarVals = this.collapsibleRollChanges
    //     .map((change) => ({
    //       filter: change.filter,
    //       value: change.finalValue as number
    //     }))
    //     // Sort filterVals by specificity: specific move names first, then categories, then "all"
    //     .toSorted((a, b) => {
    //       if (a.filter === "all") { return 1 };
    //       if (b.filter === "all") { return -1 };
    //       if (a.filter === K4ItemType.advantage as string || a.filter === K4ItemType.disadvantage as string) { return 1 };
    //       if (b.filter === K4ItemType.advantage as string || b.filter === K4ItemType.disadvantage as string) { return -1 };
    //       return 0;
    //     })
    //     .toReversed();

    //   kLog.log("[collapsedRollModifiers] Status Bar Vals", {changes: this.collapsibleRollChanges, vals: U.objClone(statusBarVals)});

    //   // Helper function to add or update the collapsed data
    //   const addOrUpdate = (
    //     display: string,
    //     value: number,
    //     filter: string,
    //     othering: Array<"all" | K4ItemClass.Rollable>,
    //     category: "all" | "type" | K4ItemClass.Rollable
    //   ) => {
    //     const existing = collapsedModifierData.find((mod) => mod.display === display);
    //     if (existing) {
    //       existing.value += value;
    //     } else {
    //       collapsedModifierData.push({display, value, filter, othering, category});
    //     }
    //   };

    //   // Iterate over the filter values and combine them
    //   statusBarVals.forEach(({filter, value}) => {
    //     switch (filter) {
    //       case "all": {
    //         categoryVals.all += value;
    //         addOrUpdate("Any Roll", value, filter, [], "all");
    //         break;
    //       }
    //       case K4ItemType.advantage as string: {
    //         value += categoryVals.all;
    //         categoryVals.advantage = value;
    //         addOrUpdate("Any Advantage Roll", value, filter, ["all"], "type");
    //         break;
    //       }
    //       case K4ItemType.disadvantage as string: {
    //         value += categoryVals.all;
    //         categoryVals.disadvantage += value;
    //         addOrUpdate("Any Disadvantage Roll", value, filter, ["all"], "type");
    //         break;
    //       }
    //       default: {
    //         const move = this.getItemByName(filter);
    //         if (!move) {
    //           // throw new Error(`Unrecognized filter value: '${filter}'`);
    //           break;
    //         }
    //         const othering: Array<"all" | K4ItemType.advantage | K4ItemType.disadvantage> = ["all"];
    //         const category = move.isSubItem()
    //           ? move.parentType as K4ItemType.advantage | K4ItemType.disadvantage
    //           : K4ItemType.move;
    //         moveTypeRecord[move.name] = category;
    //         if ([K4ItemType.advantage, K4ItemType.disadvantage].includes(category)) {
    //           othering.push(category as K4ItemType.advantage | K4ItemType.disadvantage);
    //           value += categoryVals[category as K4ItemType.advantage | K4ItemType.disadvantage];
    //         } else {
    //           value += categoryVals.all;
    //         }
    //         addOrUpdate(filter, value, filter, othering, category as K4ItemType.advantage | K4ItemType.disadvantage);
    //         break;
    //       }
    //     }
    //   });

    //   kLog.log("[collapsedRollModifiers] Initial Combination Pass", {
    //     categoryVals: U.objClone(categoryVals),
    //     collapsedModifierData: U.objClone(collapsedModifierData)
    //   });

    //   // Filter out any unnecessary values:
    //   // - remove 'all' if it is zero
    //   // - remove 'advantage' and 'disadvantage' if they are equal to all
    //   // - remove move names if they are equal to their parent category (or 'all' for basic player moves)
    //   const filteredModifierData = collapsedModifierData
    //     .filter(({value, category}) => {
    //       switch (category) {
    //         case "all": return value !== 0;
    //         case "type": return value !== categoryVals.all;
    //         case K4ItemType.advantage: return value !== categoryVals.advantage;
    //         case K4ItemType.disadvantage: return value !== categoryVals.disadvantage;
    //         default: return value !== categoryVals.all;
    //       }
    //     });


    //   kLog.log("[collapsedRollModifiers] Filtering Out Zeroes", U.objClone(filteredModifierData));

    //   // Adjust the display names to include "Other" where necessary
    //   if (filteredModifierData.some(({othering}) => othering.includes("all"))) {
    //     const allMod = filteredModifierData.find((mod) => mod.display === "Any Roll");
    //     if (allMod) {
    //       allMod.display = "Any Other Roll";
    //     }
    //   }
    //   if (filteredModifierData.some(({othering}) => othering.includes(K4ItemType.advantage))) {
    //     const advMod = filteredModifierData.find((mod) => mod.display.includes("Advantage"));
    //     if (advMod) {
    //       advMod.display = "Any Other Advantage Roll";
    //     }
    //   }
    //   if (filteredModifierData.some(({othering}) => othering.includes(K4ItemType.disadvantage))) {
    //     const disMod = filteredModifierData.find((mod) => mod.display.includes("Disadvantage"));
    //     if (disMod) {
    //       disMod.display = "Any Other Disadvantage Roll";
    //     }
    //   }

    //   kLog.log("[collapsedRollModifiers] Othering Pass", U.objClone(filteredModifierData));

    //   /** Sort the collapsed and filtered modifier data as follows:
    //    *
    //    * - Specific non-advantage, non-disadvantage moves
    //    * - Specific advantage moves
    //    * - "Advantages"/"Other Advantages" general modifier
    //    * - Specific disadvantage moves
    //    * - "Disadvantages"/"Other Disadvantages" general modifier
    //    * - "All Rolls"/"All Other Rolls" general modifier
    //    */
    //   const moveModifierData = filteredModifierData.filter(({display}) => !/^(Advantages$|Disadvantages$|^All.*Rolls$)/.test(display));
    //   const sortedModifierData = [
    //     ...moveModifierData.filter(({category}) => category === K4ItemType.move),
    //     ...moveModifierData.filter(({category}) => category === K4ItemType.advantage),
    //     filteredModifierData.find(({display}) => display.endsWith("Advantage Roll")),
    //     ...moveModifierData.filter(({category}) => category === K4ItemType.disadvantage),
    //     filteredModifierData.find(({display}) => display.endsWith("Disadvantage Roll")),
    //     filteredModifierData.find(({display}) => /^Any\s*(Other)?\s*Roll/.test(display))
    //   ].filter(U.isDefined);

    //   kLog.log("[collapsedRollModifiers] Collapsed Modifier Data", {moveModifierData, sortedModifierData});

    //   const isContributingTo = (sourceFilter: string, display: string) => {
    //     if (sourceFilter === "all") { return true; }
    //     if (display === sourceFilter) { return true; }
    //     if (display.includes("Advantage")) {
    //       return sourceFilter === K4ItemType.advantage as string;
    //     }
    //     if (display.includes("Disadvantage")) {
    //       return sourceFilter === K4ItemType.disadvantage as string;
    //     }
    //     const move = this.getItemByName(sourceFilter);
    //     if (!move) {
    //       // throw new Error(`Unrecognized filter value: '${filter}'`);
    //       return false;
    //     }
    //     const category = move.isSubItem()
    //       ? move.parentType as K4ItemType.advantage | K4ItemType.disadvantage
    //       : K4ItemType.move;
    //     if (category === K4ItemType.advantage) {
    //       return sourceFilter === K4ItemType.advantage as string;
    //     }
    //     if (category === K4ItemType.disadvantage) {
    //       return sourceFilter === K4ItemType.disadvantage as string;
    //     }
    //     return false;
    //   }

    //   // Now cycle through each modifier and construct the tooltip based on contributions from statusBarChanges
    //   return sortedModifierData.map((mData) => {
    //     const tooltip = `<ul>${this.collapsibleRollChanges
    //       .filter(({filter}) => isContributingTo(filter, mData.display))
    //       .toSorted((a, b) => b.modData.value - a.modData.value)
    //       .map(({modData}) => {
    //         return [
    //           "<li>",
    //           `<strong class='${modData.cssClasses[0]}'>${modData.value >= 0 ? "+" : "–"}${Math.abs(modData.value)}</strong> from <strong class='${modData.cssClasses[0]}'>${modData.name}</strong>`,
    //           "</li>"
    //         ].join("")
    //       }).join("")}</ul>`;
    //       return {
    //         tooltip,
    //         ...mData
    //       };
    //     });
    // }



  }


}
