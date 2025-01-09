import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData} from "./Components/ItemDataModel_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Disadvantage: fields.DataSchema = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  currentHold: new fields.NumberField()
}

export default class ItemDataModel_Disadvantage extends TypeDataModel<typeof ItemSchema_Disadvantage, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Disadvantage {
    return ItemSchema_Disadvantage;
  }
}
