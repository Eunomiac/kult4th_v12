import { ModDefField } from "../fields/roll";
import DataModel = foundry.abstract.DataModel;
import fields = foundry.data.fields;

const ConditionSchema = {
  id: new fields.StringField({required: true, initial: ""}),
  label: new fields.StringField({required: true, initial: ""}),
  description: new fields.StringField({required: true, initial: ""}),
  type: new fields.StringField({required: true, initial: ""}),
  modDef: ModDefField(),
  isApplyingToRolls: new fields.BooleanField({required: true, initial: false})
}

export default class ConditionModel extends DataModel<typeof ConditionSchema> {
  static override defineSchema() {
    return ConditionSchema;
  }
}
