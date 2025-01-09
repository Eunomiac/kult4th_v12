import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData} from "./Components/ItemDataModel_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Advantage: fields.DataSchema = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  currentHold: new fields.NumberField()
}

export default class ItemDataModel_Advantage extends TypeDataModel<typeof ItemSchema_Advantage, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Advantage {
    return ItemSchema_Advantage;
  }
}
