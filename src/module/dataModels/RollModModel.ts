import DataModel = foundry.abstract.DataModel;
import fields = foundry.data.fields;

const RollModSchema = {
  id: new fields.StringField({required: true, initial: ""}),
  filter: new fields.StringField({required: true, initial: "all"}),
  value: new fields.NumberField({required: true, initial: 0, step: 1, integer: true}),
  name: new fields.StringField({required: true, initial: ""}),
  display: new fields.StringField({required: false}),
  tooltip: new fields.StringField({required: true, initial: ""}),
  cssClasses: new fields.ArrayField(new fields.StringField({required: true, initial: ""})),
  othering: new fields.ArrayField(new fields.StringField({required: true, initial: ""})),
  category: new fields.StringField({required: true, initial: ""})
}

export default class RollModModel extends DataModel<typeof RollModSchema> {
  static override defineSchema() {
    return RollModSchema;
  }
}
