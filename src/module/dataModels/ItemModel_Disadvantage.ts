import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Disadvantage = {
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

export default class ItemDataModel_Disadvantage extends TypeDataModel<typeof ItemSchema_Disadvantage, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Disadvantage {
    return ItemSchema_Disadvantage;
  }
}
