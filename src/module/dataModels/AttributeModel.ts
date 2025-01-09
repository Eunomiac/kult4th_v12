// import { ModDefField } from "../fields/roll";
import {K4Attribute} from "../scripts/enums";
import DataModel = foundry.abstract.DataModel;
import fields = foundry.data.fields;

const AttributeSchema = {
  name: new fields.StringField(),
  value: new fields.NumberField({required: true, initial: 0}),
  min: new fields.NumberField({required: true, initial: -3}),
  max: new fields.NumberField({required: true, initial: 7}),
  key: new fields.StringField({required: true, initial: K4Attribute.ask, choices: Object.values(K4Attribute)}),
  selectList: new fields.ArrayField(new fields.SchemaField({
    value: new fields.NumberField({required: true, initial: 0}),
    label: new fields.StringField({required: true, initial: ""})
  }), {required: true, initial: []}),
}

export default class AttributeModel extends DataModel<typeof AttributeSchema> {
  static override defineSchema(): typeof AttributeSchema {
    return AttributeSchema;
  }
}
