import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData, type ItemDerivedData_RulesData, type ItemDerivedData_Base, type ItemDerivedData_HasSubItems} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import {ValueMaxField} from "./Fields/UtilityFields";
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const ItemSchema_Weapon = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  ammo: ValueMaxField(0, 0, Infinity, "Ammo", false)
}

type ItemDerivedData_Weapon = ItemDerivedData_Base & ItemDerivedData_HasSubItems & ItemDerivedData_RulesData;

export default class ItemDataModel_Weapon extends TypeDataModel<typeof ItemSchema_Weapon, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Weapon>> {
  static override defineSchema(): typeof ItemSchema_Weapon {
    return ItemSchema_Weapon;
  }
}
