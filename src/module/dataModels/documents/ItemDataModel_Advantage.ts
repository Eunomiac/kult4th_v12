import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData, type ItemDerivedData_Base, type ItemDerivedData_HasSubItems, type ItemDerivedData_RulesData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const getItemSchema_Advantage = () => ({
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  currentHold: new fields.NumberField()
})

type ItemSchema_Advantage = ReturnType<typeof getItemSchema_Advantage>;

type ItemDerivedData_Advantage = ItemDerivedData_Base & ItemDerivedData_HasSubItems & ItemDerivedData_RulesData;

export default class ItemDataModel_Advantage extends TypeDataModel<ItemSchema_Advantage, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Advantage>> {

  private static _definedSchema: Maybe<ItemSchema_Advantage>;
  static override defineSchema(): ItemSchema_Advantage {
    if (!ItemDataModel_Advantage._definedSchema) {
      ItemDataModel_Advantage._definedSchema = getItemSchema_Advantage();
    }
    return ItemDataModel_Advantage._definedSchema;
  }
}
