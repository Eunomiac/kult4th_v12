import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData, type ItemDerivedData_Base, type ItemDerivedData_HasSubItems, type ItemDerivedData_RulesData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const ItemSchema_Advantage = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  currentHold: new fields.NumberField()
}

type ItemDerivedData_Advantage = ItemDerivedData_Base & ItemDerivedData_HasSubItems & ItemDerivedData_RulesData;

export default class ItemDataModel_Advantage extends TypeDataModel<typeof ItemSchema_Advantage, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Advantage>> {
  static override defineSchema(): typeof ItemSchema_Advantage {
    return ItemSchema_Advantage;
  }
}
