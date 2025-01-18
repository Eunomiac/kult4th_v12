import SVGDATA from "../scripts/svgdata";
import {K4WoundType, K4ConditionType, K4ItemType, K4ActorType} from "../scripts/enums";
import ItemDataModel_Advantage from "../dataModels/documents/ItemDataModel_Advantage";
import ItemDataModel_Disadvantage from "../dataModels/documents/ItemDataModel_Disadvantage";
import ItemDataModel_DarkSecret from "../dataModels/documents/ItemDataModel_DarkSecret";
import ItemDataModel_Gear from "../dataModels/documents/ItemDataModel_Gear";
import ItemDataModel_GMTracker from "../dataModels/documents/ItemDataModel_GMTracker";
import ItemDataModel_Move from "../dataModels/documents/ItemDataModel_Move";
import ItemDataModel_Relation from "../dataModels/documents/ItemDataModel_Relation";
import ItemDataModel_Weapon from "../dataModels/documents/ItemDataModel_Weapon";
import ActorDataModel_PC from "../dataModels/documents/ActorDataModel_PC";
import ActorDataModel_NPC from "../dataModels/documents/ActorDataModel_NPC";
import K4Actor from "../documents/K4Actor";
import K4Item from "../documents/K4Item";

declare global {

  type K4ItemOfType<T extends K4ItemType> =
    T extends K4ItemType.advantage ? K4Item & {system: ItemDataModel_Advantage}
  : T extends K4ItemType.disadvantage ? K4Item & {system: ItemDataModel_Disadvantage}
  : T extends K4ItemType.darksecret ? K4Item & {system: ItemDataModel_DarkSecret}
  : T extends K4ItemType.gear ? K4Item & {system: ItemDataModel_Gear}
  : T extends K4ItemType.gmtracker ? K4Item & {system: ItemDataModel_GMTracker}
  : T extends K4ItemType.move ? K4Item & {system: ItemDataModel_Move}
  : T extends K4ItemType.relation ? K4Item & {system: ItemDataModel_Relation}
  : T extends K4ItemType.weapon ? K4Item & {system: ItemDataModel_Weapon}
  : K4Item;

  namespace K4ItemClass {
    export type Parent = K4ItemOfType<K4ItemType.advantage> | K4ItemOfType<K4ItemType.disadvantage> | K4ItemOfType<K4ItemType.weapon> | K4ItemOfType<K4ItemType.gear>;
    export type Static = K4ItemOfType<K4ItemType.move> | K4ItemOfType<K4ItemType.advantage> | K4ItemOfType<K4ItemType.disadvantage> | K4ItemOfType<K4ItemType.gear>;
    export type Passive = K4ItemOfType<K4ItemType.move> | K4ItemOfType<K4ItemType.advantage> | K4ItemOfType<K4ItemType.disadvantage> | K4ItemOfType<K4ItemType.darksecret> | K4ItemOfType<K4ItemType.relation> | K4ItemOfType<K4ItemType.weapon> | K4ItemOfType<K4ItemType.gear>;
    export type Active = K4ItemOfType<K4ItemType.move> | K4ItemOfType<K4ItemType.advantage> | K4ItemOfType<K4ItemType.disadvantage> | K4ItemOfType<K4ItemType.gear>;
    export type HaveRules = K4ItemOfType<K4ItemType.move> | K4ItemOfType<K4ItemType.advantage> | K4ItemOfType<K4ItemType.disadvantage> | K4ItemOfType<K4ItemType.darksecret> | K4ItemOfType<K4ItemType.weapon> | K4ItemOfType<K4ItemType.gear>;
    export type HaveResults = K4ItemOfType<K4ItemType.move>;
    export type HaveMainEffects = K4ItemOfType<K4ItemType.move> | K4ItemOfType<K4ItemType.advantage> | K4ItemOfType<K4ItemType.disadvantage> | K4ItemOfType<K4ItemType.weapon> | K4ItemOfType<K4ItemType.gear>;
  }

  type K4ActorOfType<T extends K4ActorType> =
    T extends K4ActorType.pc ? K4Actor & {system: ActorDataModel_PC}
  : T extends K4ActorType.npc ? K4Actor & {system: ActorDataModel_NPC}
  : K4Actor;

  interface StripButtonData {
    icon: keyof typeof SVGDATA,
    dataset: Record<string, string>,
    buttonClasses?: string[],
    tooltip?: string
  }
  interface HoverStripData {
    id: string,
    type: K4ItemType | K4WoundType | K4ConditionType | "edge",
    display: string,
    icon: string,
    isGlowing?: "red"|"blue"|"gold"|false,
    stripClasses: string[],
    buttons: StripButtonData[],
    dataset?: Record<string, string>,
    dataTarget?: string,
    placeholder?: string,
    tooltip?: string
  }
}
