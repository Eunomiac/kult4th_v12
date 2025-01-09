import {Archetypes} from "../../scripts/constants";
import {K4Attribute, K4Archetype, ArchetypeTier, K4ActorType, K4ItemType} from "../../scripts/enums";
import ConditionModel from "../ConditionModel";
import WoundModel from "../WoundModel";
import { ValueMaxField } from "../../fields/utility";
import { ModDefField } from "../../fields/roll";
import { CharGenField } from "../../fields/actor";
import K4Item from "../../documents/K4Item";
import U from "../../scripts/utilities";
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

export default class ActorDataModel_PC extends TypeDataModel<typeof ActorSchema_PC, Actor.ConfiguredInstance> {
  static override defineSchema(): typeof ActorSchema_PC {
    return ActorSchema_PC;
  }

  moves: K4Item.OfType<K4ItemType.move>[] = [];
  basicMoves: K4Item.OfType<K4ItemType.move>[] = [];
  derivedMoves: K4Item.OfType<K4ItemType.move>[] = [];
  activeEdges: K4Item.OfType<K4ItemType.move>[] = [];
  derivedEdges: K4Item.OfType<K4ItemType.move>[] = [];
  advantages: K4Item.OfType<K4ItemType.advantage>[] = [];
  disadvantages: K4Item.OfType<K4ItemType.disadvantage>[] = [];
  darkSecrets: K4Item.OfType<K4ItemType.darksecret>[] = [];
  weapons: K4Item.OfType<K4ItemType.weapon>[] = [];
  gear: K4Item.OfType<K4ItemType.gear>[] = [];
  relations: K4Item.OfType<K4ItemType.relation>[] = [];
  derivedItems: K4Item.OfType<K4ItemType.move>[] = [];

  maxWounds: {serious: number, critical: number, total: number} = {serious: 0, critical: 0, total: 0};
  armor: number = 0;
  // statusBarEffects: K4ActiveEffect[] = [];
  /**
     * Prepares data specific to player characters.
     */
  override prepareDerivedData() {
    super.prepareDerivedData();
    this.moves = this.parent.getItemsOfType(K4ItemType.move)
      .sort((a, b) => a.name.localeCompare(b.name));
    this.basicMoves = this.moves.filter((move) => move.isBasicMove());
    this.derivedMoves = this.moves.filter((move): move is K4Item.OfType<K4ItemType.move> & K4SubItem => move.isSubItem())
      .filter((subItem) => !subItem.isEdge());
    this.derivedEdges = this.moves.filter((move): move is K4Item.OfType<K4ItemType.move> & K4SubItem => move.isEdge());
    this.activeEdges = (() => {
      if (!this.parent.isType(K4ActorType.pc)) {return [];}
      if (!this.edges.sourceName) {return [];}
      if (!this.edges.value) {return [];}
      return this.derivedEdges
        .filter((edge): this is K4Actor.OfType<K4ActorType.pc> => edge.system.parentItem.name === this.edges.sourceName);
    })();
    this.advantages = this.parent.getItemsOfType(K4ItemType.advantage);
    this.disadvantages = this.parent.getItemsOfType(K4ItemType.disadvantage);
    this.darkSecrets = this.parent.getItemsOfType(K4ItemType.darksecret);
    this.weapons = this.parent.getItemsOfType(K4ItemType.weapon);
    this.gear = this.parent.getItemsOfType(K4ItemType.gear);
    this.relations = this.parent.getItemsOfType(K4ItemType.relation);
    this.derivedItems = this.parent.items.filter((item: K4Item): item is K4Item & K4SubItem => item.isSubItem());

    this.maxWounds = {
      serious: this.modifiers.wounds_serious.length,
      critical: this.modifiers.wounds_critical.length,
      total: (this.modifiers.wounds_serious.length + this.modifiers.wounds_critical.length)
    };
    this.armor = 1 + this.gear.reduce((acc, gear) => acc + (gear.system.armor ?? 0), 0);

    if ((this.stability.value ?? 0) > (this.stability.max ?? 10)) {
      this.stability.value = this.stability.max;
    }
    if ((this.stability.value ?? 10) < (this.stability.min ?? 0)) {
      this.stability.value = this.stability.min;
    }

    // Call all 'system change' custom functions.
    this.parent.systemChanges.forEach((change) => { void change.apply(this) });

    // this.statusBarEffects = this.parent.effects.filter((effect) => effect.eData.inStatusBar && effect.isNonZero);
  }


}
