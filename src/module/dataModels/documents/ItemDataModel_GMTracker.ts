import {ItemSchemaComponent_Base, ItemSchemaComponent_HasSubItems} from "./Components/ItemDataModel_Components";
import {K4GamePhase} from "../../scripts/enums";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_GMTracker: fields.DataSchema = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_HasSubItems(),
  gamePhase: new fields.StringField({required: true, initial: K4GamePhase.intro, choices: Object.values(K4GamePhase)})
}

export default class ItemDataModel_GMTracker extends TypeDataModel<typeof ItemSchema_GMTracker, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_GMTracker {
    return ItemSchema_GMTracker;
  }
}
