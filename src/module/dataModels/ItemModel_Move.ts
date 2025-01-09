import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Move = {
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

export default class ItemDataModel_Move extends TypeDataModel<typeof ItemSchema_Move, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Move {
    return ItemSchema_Move;
  }
}
