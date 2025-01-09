import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems, ItemSchemaComponent_RulesData} from "./Components/ItemDataModel_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Gear: fields.DataSchema = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  ...ItemSchemaComponent_RulesData(),
  armor: new fields.NumberField({required: false})
}

export default class ItemDataModel_Gear extends TypeDataModel<typeof ItemSchema_Gear, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Gear {
    return ItemSchema_Gear;
  }
}
