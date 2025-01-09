import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_GMTracker = {
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

export default class ItemDataModel_GMTracker extends TypeDataModel<typeof ItemSchema_GMTracker, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_GMTracker {
    return ItemSchema_GMTracker;
  }
}
