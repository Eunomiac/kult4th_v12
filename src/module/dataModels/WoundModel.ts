import fields = foundry.data.fields;
import DataModel = foundry.abstract.DataModel;

const WoundSchema = {
  id: new fields.StringField({required: true, initial: ""}),
  label: new fields.StringField({required: true, initial: ""}),
  isCritical: new fields.BooleanField({required: true, initial: false}),
  isStabilized: new fields.BooleanField({required: true, initial: false}),
  isApplyingToRolls: new fields.BooleanField({required: true, initial: false})
};

export default class WoundModel extends DataModel<typeof WoundSchema> {
  static override defineSchema() {
    return WoundSchema;
  }
}
