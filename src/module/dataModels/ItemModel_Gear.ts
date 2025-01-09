import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Gear = {
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

export default class ItemDataModel_Gear extends TypeDataModel<typeof ItemSchema_Gear, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Gear {
    return ItemSchema_Gear;
  }
}
