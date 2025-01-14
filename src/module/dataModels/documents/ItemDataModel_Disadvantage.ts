import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData, type ItemDerivedData_HasSubItems, type ItemDerivedData_Base, type ItemDerivedData_RulesData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const getItemSchema_Disadvantage = () => ({
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  currentHold: new fields.NumberField()
})

type ItemSchema_Disadvantage = ReturnType<typeof getItemSchema_Disadvantage>;

type ItemDerivedData_Disadvantage = ItemDerivedData_Base & ItemDerivedData_HasSubItems & ItemDerivedData_RulesData;

export default class ItemDataModel_Disadvantage extends TypeDataModel<ItemSchema_Disadvantage, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Disadvantage>> {
  private static _definedSchema: Maybe<ItemSchema_Disadvantage>;
  static override defineSchema(): ItemSchema_Disadvantage {
    if (!ItemDataModel_Disadvantage._definedSchema) {
      ItemDataModel_Disadvantage._definedSchema = getItemSchema_Disadvantage();
    }
    return ItemDataModel_Disadvantage._definedSchema;
  }
}
