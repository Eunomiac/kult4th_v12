// import K4ActiveEffect from "../documents/K4ActiveEffect.js";
import K4Actor from "../documents/K4Actor";
import {K4ActorType, K4ItemType} from "../scripts/enums.js";
import ActorDataModel_PC from "../dataModels/ActorModel_PC.js";
import ActorDataModel_NPC from "../dataModels/ActorModel_NPC.js";
import K4Item from "../documents/K4Item";
import ItemDataModel_Advantage from "../dataModels/ItemModel_Advantage.js";
import ItemDataModel_Disadvantage from "../dataModels/ItemModel_Disadvantage.js";
import ItemDataModel_DarkSecret from "../dataModels/ItemModel_DarkSecret.js";
import ItemDataModel_Gear from "../dataModels/ItemModel_Gear.js";
import ItemDataModel_GMTracker from "../dataModels/ItemModel_GMTracker.js";
import ItemDataModel_Move from "../dataModels/ItemModel_Move.js";
import ItemDataModel_Relation from "../dataModels/ItemModel_Relation.js";
import ItemDataModel_Weapon from "../dataModels/ItemModel_Weapon.js";
import Document = foundry.abstract.Document;
// import K4PCSheet from "../documents/K4PCSheet.js";
// import K4NPCSheet from "../documents/K4NPCSheet.js";
// import K4ChatMessage from "../documents/K4ChatMessage.js";
// import K4Dialog from "../documents/K4Dialog.js";
// import K4Item from "../documents/K4Item.js";
// import K4Roll, {K4RollResult} from "../documents/K4Roll.js";
// import K4Scene from "../documents/K4Scene.js";

// import K4Config from "../scripts/config.js";

declare global {

  interface DocumentClassConfig {
    Actor: typeof K4Actor;
    Item: typeof K4Item;
  }

  interface DataModelConfig {
    Actor: {
      [K4ActorType.pc]: typeof ActorDataModel_PC,
      [K4ActorType.npc]: typeof ActorDataModel_NPC
    }
    Item: {
      [K4ItemType.advantage]: typeof ItemDataModel_Advantage,
      [K4ItemType.disadvantage]: typeof ItemDataModel_Disadvantage,
      [K4ItemType.darksecret]: typeof ItemDataModel_DarkSecret,
      [K4ItemType.gear]: typeof ItemDataModel_Gear,
      [K4ItemType.gmtracker]: typeof ItemDataModel_GMTracker,
      [K4ItemType.move]: typeof ItemDataModel_Move,
      [K4ItemType.relation]: typeof ItemDataModel_Relation,
      [K4ItemType.weapon]: typeof ItemDataModel_Weapon
    }
  }

  interface FlagConfig {
    ActiveEffect: {
      kult4th: Record<string, unknown> & {
        // data: Maybe<K4ActiveEffect.FlagData>
      };
    };
    Actor: {
      kult4th: {
        sheetTab: string;
      }
    };
    ChatMessage: {
      kult4th: {
        cssClasses: string[];
        isSummary: boolean;
        isAnimated: boolean;
        isRoll: boolean;
        isTrigger: boolean;
        // rollOutcome: Maybe<K4RollResult>;
        isEdge: boolean;
        // rollData: K4Roll.Serialized.Base;
      }
    }
  }

  interface SettingConfig {
    // Values: {
      "kult4th.debug": number;
      "kult4th.gears": boolean;
      "kult4th.shadows": boolean;
      "kult4th.blur": boolean;
      "kult4th.flare": boolean;
      "kult4th.animations": boolean;
      "kult4th.useStabilityVariant": boolean;
    // }
  }

  type TestConfiguration = Document.ConfiguredClassForName<"Actor">;
}
