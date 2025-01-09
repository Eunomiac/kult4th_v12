import {ItemSchemaComponent_Base} from "./Components/ItemDataModel_Components";
import {ValueMaxField} from "../../fields/utility";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Relation: fields.DataSchema = {
  ...ItemSchemaComponent_Base(),
  target: new fields.DocumentUUIDField({required: false, collection: "actors"}),
  concept: new fields.StringField(),
  strength: ValueMaxField(0, 0, 2)
}

export default class ItemDataModel_Relation extends TypeDataModel<typeof ItemSchema_Relation, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Relation {
    return ItemSchema_Relation;
  }
}
