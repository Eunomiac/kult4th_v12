import {ItemSchemaComponent_Base, ItemSchemaComponent_RulesData, type ItemDerivedData_Base, type ItemDerivedData_RulesData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const getItemSchema_DarkSecret = () => ({
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_RulesData(),
  drive: new fields.StringField(),
  currentHold: new fields.NumberField(),
  playerNotes: new fields.HTMLField()
})

type ItemSchema_DarkSecret = ReturnType<typeof getItemSchema_DarkSecret>;

type ItemDerivedData_DarkSecret = ItemDerivedData_Base & ItemDerivedData_RulesData;

export default class ItemDataModel_DarkSecret extends TypeDataModel<ItemSchema_DarkSecret, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_DarkSecret>> {
  private static _definedSchema: Maybe<ItemSchema_DarkSecret>;
  static override defineSchema(): ItemSchema_DarkSecret {
    if (!ItemDataModel_DarkSecret._definedSchema) {
      ItemDataModel_DarkSecret._definedSchema = getItemSchema_DarkSecret();
    }
    return ItemDataModel_DarkSecret._definedSchema;
  }
}
