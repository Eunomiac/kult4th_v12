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

const ItemSchemaGear = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  armor: new fields.NumberField({required: false})
}

type ItemDerivedData_Gear = ItemDerivedData_Base & ItemDerivedData_HasSubItems & ItemDerivedData_RulesData;

export default class ItemDataModel_Gear extends TypeDataModel<typeof ItemSchemaGear, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Gear>> {
  static override defineSchema() {
    return ItemSchemaGear;
  }
}
