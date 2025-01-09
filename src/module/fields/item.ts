import {K4ItemType} from "../scripts/enums";
import fields = foundry.data.fields;

export function ListDataField() {
  return new fields.SchemaField({
    name: new fields.StringField({required: true}),
    items: new fields.ArrayField(new fields.StringField({required: true})),
    intro: new fields.StringField({required: false}),
    overrideField: new fields.StringField({required: false})
  });
}

export function ParentItemReferenceField(required: boolean) {
  return new fields.SchemaField({
    name: new fields.StringField({required: true}),
    uuid: new fields.DocumentUUIDField(),
    type: new fields.StringField({required: true, choices: Object.values(K4ItemType)})
  }, {required, nullable: !required});
}
