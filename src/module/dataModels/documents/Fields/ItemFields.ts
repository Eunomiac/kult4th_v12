import {K4ItemType} from "../../../scripts/enums";
import K4Item from "../../../documents/K4Item";
import TypeDataModel = foundry.abstract.TypeDataModel;
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

export function SubItemDataField() {
  return new fields.SchemaField({
    name: new fields.StringField({required: true}),
    type: new fields.StringField({required: true, choices: Object.values(K4ItemType)}),
    img: new fields.FilePathField({required: true, categories: ["IMAGE"], initial: (model: unknown) => {
      if (model instanceof TypeDataModel) {
        const parent = model.parent;
        if (parent instanceof K4Item) {
          return parent.img;
        }
      }
      return null;
    }}),
    system: new fields.TypeDataField(K4Item)
  });
}
