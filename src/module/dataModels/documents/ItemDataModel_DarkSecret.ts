import {ItemSchemaComponent_Base, ItemSchemaComponent_RulesData} from "./Components/ItemDataModel_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_DarkSecret: fields.DataSchema = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_RulesData(),
  drive: new fields.StringField(),
  currentHold: new fields.NumberField(),
  playerNotes: new fields.HTMLField()
}

export default class ItemDataModel_DarkSecret extends TypeDataModel<typeof ItemSchema_DarkSecret, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_DarkSecret {
    return ItemSchema_DarkSecret;
  }
}
