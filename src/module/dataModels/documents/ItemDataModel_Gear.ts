import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData, type ItemDerivedData_Base, type ItemDerivedData_HasSubItems, type ItemDerivedData_RulesData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const getItemSchema_Gear = () => ({
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  armor: new fields.NumberField({required: false})
})

type ItemSchema_Gear = ReturnType<typeof getItemSchema_Gear>;

type ItemDerivedData_Gear = ItemDerivedData_Base & ItemDerivedData_HasSubItems & ItemDerivedData_RulesData;

export default class ItemDataModel_Gear extends TypeDataModel<ItemSchema_Gear, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Gear>> {
  private static _definedSchema: Maybe<ItemSchema_Gear>;
  static override defineSchema(): ItemSchema_Gear {
    if (!ItemDataModel_Gear._definedSchema) {
      ItemDataModel_Gear._definedSchema = getItemSchema_Gear();
    }
    return ItemDataModel_Gear._definedSchema;
  }
}
