import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, type ItemDerivedData_HasSubItems, type ItemDerivedData_Base} from "./Components/ItemSchema_Components";
import {K4GamePhase} from "../../scripts/enums";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const getItemSchema_GMTracker = () => ({
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  gamePhase: new fields.StringField({required: true, initial: K4GamePhase.intro, choices: Object.values(K4GamePhase)})
})

const ItemSchemaGMTracker = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  gamePhase: new fields.StringField({required: true, initial: K4GamePhase.intro, choices: Object.values(K4GamePhase)})
}

type ItemDerivedData_GMTracker = ItemDerivedData_Base & ItemDerivedData_HasSubItems;

export default class ItemDataModel_GMTracker extends TypeDataModel<typeof ItemSchemaGMTracker, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_GMTracker>> {
  static override defineSchema() {
    return ItemSchemaGMTracker;
  }
}
