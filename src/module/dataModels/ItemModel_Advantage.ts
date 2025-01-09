import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Advantage = {
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

export default class ItemDataModel_Advantage extends TypeDataModel<typeof ItemSchema_Advantage, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Advantage {
    return ItemSchema_Advantage;
  }
}
