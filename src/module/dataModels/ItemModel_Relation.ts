import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Relation = {
  description: new fields.HTMLField({
    required: true,
    blank: true,
    initial: "",
    label: "Description"
  }),
  notes: new fields.HTMLField({
    required: true,
    blank: true,
    initial: "",
    label: "Notes"
  })
}

export default class ItemDataModel_Relation extends TypeDataModel<typeof ItemSchema_Relation, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Relation {
    return ItemSchema_Relation;
  }
}
