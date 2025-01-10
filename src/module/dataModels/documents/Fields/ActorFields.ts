import fields = foundry.data.fields;

export function CharGenField() {
  return new fields.SchemaField({
    selAdvantages: new fields.ArrayField(
      new fields.StringField(),
      {
        required: true,
        initial: [],
        label: "Selected Advantages"
      }
    ),
    selDisadvantages: new fields.ArrayField(
      new fields.StringField(),
      {
        required: true,
        initial: [],
        label: "Selected Disadvantages"
      }
    ),
    selDarkSecrets: new fields.ArrayField(
      new fields.StringField(),
      {
        required: true,
        initial: [],
        label: "Selected Dark Secrets"
      }
    ),
    extraDisadvantages: new fields.ArrayField(
      new fields.StringField(),
      {
        required: true,
        initial: [],
        label: "Other Disadvantages"
      }
    ),
    extraDarkSecrets: new fields.ArrayField(
      new fields.StringField(),
      {
        required: true,
        initial: [],
        label: "Other Dark Secrets"
      }
    ),
    traitNotes: new fields.ObjectField({
      required: true,
      nullable: false,
      initial: {}
    })
  });
}
