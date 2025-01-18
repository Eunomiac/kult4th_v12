import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData, type ItemDerivedData_HasSubItems} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const ItemSchemaAdvantage = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  currentHold: new fields.NumberField()
};

type ItemDerivedData_Advantage = ItemDerivedData_HasSubItems;

export default class ItemDataModel_Advantage extends TypeDataModel<typeof ItemSchemaAdvantage, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Advantage>> {

  static override defineSchema() {
    return ItemSchemaAdvantage;
  }
}
