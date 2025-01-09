import {ItemSchemaComponent_Base, ItemSchemaComponent_CanBeSubItem, ItemSchemaComponent_RulesData, ItemSchemaComponent_ResultsData} from "./Components/ItemDataModel_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import {K4Attribute} from "../../scripts/enums";
import fields = foundry.data.fields;

const ItemSchema_Move: fields.DataSchema = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_CanBeSubItem(),
  ...ItemSchemaComponent_RulesData(),
  ...ItemSchemaComponent_ResultsData(),
  attribute: new fields.StringField({required: true, choices: Object.values(K4Attribute)})
}

export default class ItemDataModel_Move extends TypeDataModel<typeof ItemSchema_Move, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Move {
    return ItemSchema_Move;
  }
}
