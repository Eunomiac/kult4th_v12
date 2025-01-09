// import K4Item, {K4ItemType} from "./K4Item.js";
// import K4PCSheet from "./K4PCSheet.js";
// import K4NPCSheet from "./K4NPCSheet.js";
// import K4CharGen from "./K4CharGen.js";
// import K4ActiveEffect from "./K4ActiveEffect.js";
// import K4Socket, {UserTargetRef} from "./K4Socket.js";


import {Archetypes} from "../scripts/constants";
import {K4Attribute, K4Archetype, ArchetypeTier} from "../scripts/enums";
import ConditionModel from "./ConditionModel";
import WoundModel from "./WoundModel";
import { ValueMaxField } from "../fields/utility";
import { ModDefField } from "../fields/roll";
import { CharGenField } from "../fields/actor";
import U from "../scripts/utilities";
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
    hint: "This character's archetype. 'Sleeper' is appropriate for scenarios that are not using archetypes.",
    validate: (value: string) => {
      if (!(value in Archetypes)) {
        return false;
      }
    }
  }),
  description: new fields.HTMLField({
    required: true,
    blank: true,
    initial: "",
    label: "Description"
  }),
  occupation: new fields.StringField({
    required: true,
    blank: true,
    initial: "",
    label: "Occupation"
  }),
  looks: new fields.SchemaField({
    clothes: new fields.HTMLField({
      required: true,
      blank: true,
      initial: "",
      label: "Clothes"
    }),
    face: new fields.HTMLField({
      required: true,
      blank: true,
      initial: "",
      label: "Face"
    }),
    eyes: new fields.HTMLField({
      required: true,
      blank: true,
      initial: "",
      label: "Eyes"
    }),
    body: new fields.HTMLField({
      required: true,
      blank: true,
      initial: "",
      label: "Body"
    })
  }),
  history: new fields.HTMLField({
    required: true,
    blank: true,
    initial: "",
    label: "History"
  }),
  notes: new fields.HTMLField({
    required: true,
    blank: true,
    initial: "",
    label: "Notes"
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
  isSheetLocked: new fields.BooleanField({required: true, initial: false})
}

export default class ActorDataModel_PC extends TypeDataModel<typeof ActorSchema_PC, Actor.ConfiguredInstance> {
  static override defineSchema(): typeof ActorSchema_PC {
    return ActorSchema_PC;
  }
}



  // /**
  //  * Retrieves items of a specific type.
  //  * @param {Type} type - The type of items to retrieve.
  //  * @returns {Array<K4Item<Type>>} An array of items of the specified type.
  //  */
  //   getItemsOfType<Type extends K4ItemType>(type: Type): Array<K4Item<Type>> {
  //     return ([...this.items] as K4Item[]).filter((item: K4Item): item is K4Item<Type> => item.is(type));
  //   }

  // get moves(): Array<K4Item<K4ItemType.move>> {
  //   return this.getItemsOfType(K4ItemType.move);
  // }
  // get basicMoves(): Array<K4Item<K4ItemType.move>> {
  //   return this.getItemsOfType(K4ItemType.move);
  // }
  // get derivedMoves(): Array<K4Item<K4ItemType.move>> {
  //   return this.getItemsOfType(K4ItemType.move);
  // }
  // get activeEdges(): Array<K4Item<K4ItemType.move>> {
  //   return this.getItemsOfType(K4ItemType.move);
  // }
  // get advantages(): Array<K4Item<K4ItemType.advantage>> {
  //   return this.getItemsOfType(K4ItemType.advantage);
  // }
  // get disadvantages(): Array<K4Item<K4ItemType.disadvantage>> {
  //   return this.getItemsOfType(K4ItemType.disadvantage);
  // }
  // get darkSecrets(): Array<K4Item<K4ItemType.darksecret>> {
  //   return this.getItemsOfType(K4ItemType.darksecret);
  // }
  // get weapons(): Array<K4Item<K4ItemType.weapon>> {
  //   return this.getItemsOfType(K4ItemType.weapon);
  // }
  // get gear(): Array<K4Item<K4ItemType.gear>> {
  //   return this.getItemsOfType(K4ItemType.gear);
  // }
  // get relations(): Array<K4Item<K4ItemType.relation>> {
  //   return this.getItemsOfType(K4ItemType.relation);
  // }

  // get modifiersReport(): string { return ""; }
  // get statusBarEffects(): Array<K4ActiveEffect> { return []; }
  // override get stability(): ValueMax & {statusOptions: string[]} { return {min: 0, max: 10, value: 0, statusOptions: []}; }
  // get armor(): number { return 0; }
