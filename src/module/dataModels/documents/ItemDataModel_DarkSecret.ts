import {ItemSchemaComponent_Base, ItemSchemaComponent_RulesData, type ItemDerivedData_Base, type ItemDerivedData_RulesData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const ItemSchemaDarkSecret = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_RulesData(),
  drive: new fields.StringField(),
  currentHold: new fields.NumberField(),
  playerNotes: new fields.HTMLField()
}

type ItemDerivedData_DarkSecret = ItemDerivedData_Base & ItemDerivedData_RulesData;

export default class ItemDataModel_DarkSecret extends TypeDataModel<typeof ItemSchemaDarkSecret, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_DarkSecret>> {
  static override defineSchema() {
    return ItemSchemaDarkSecret;
  }
}
