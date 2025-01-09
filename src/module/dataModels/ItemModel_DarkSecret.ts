import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_DarkSecret = {
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

export default class ItemDataModel_DarkSecret extends TypeDataModel<typeof ItemSchema_DarkSecret, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_DarkSecret {
    return ItemSchema_DarkSecret;
  }
}
