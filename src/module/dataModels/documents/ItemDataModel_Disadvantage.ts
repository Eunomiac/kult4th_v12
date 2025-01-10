import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData, type ItemDerivedData_HasSubItems, type ItemDerivedData_Base, type ItemDerivedData_RulesData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const ItemSchema_Disadvantage = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  currentHold: new fields.NumberField()
}

type ItemDerivedData_Disadvantage = ItemDerivedData_Base & ItemDerivedData_HasSubItems & ItemDerivedData_RulesData;

export default class ItemDataModel_Disadvantage extends TypeDataModel<typeof ItemSchema_Disadvantage, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Disadvantage>> {
  static override defineSchema(): typeof ItemSchema_Disadvantage {
    return ItemSchema_Disadvantage;
  }
}
