import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData} from "./Components/ItemDataModel_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import {ValueMaxField} from "../../fields/utility";

const ItemSchema_Weapon: fields.DataSchema = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  ammo: ValueMaxField(0, 0, Infinity, "Ammo", false)
}

export default class ItemDataModel_Weapon extends TypeDataModel<typeof ItemSchema_Weapon, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Weapon {
    return ItemSchema_Weapon;
  }
}
