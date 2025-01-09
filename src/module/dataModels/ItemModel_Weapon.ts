import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ItemSchema_Weapon = {
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

export default class ItemDataModel_Weapon extends TypeDataModel<typeof ItemSchema_Weapon, Item.ConfiguredInstance> {
  static override defineSchema(): typeof ItemSchema_Weapon {
    return ItemSchema_Weapon;
  }
}
