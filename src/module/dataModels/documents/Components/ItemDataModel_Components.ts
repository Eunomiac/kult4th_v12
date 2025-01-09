import {ListDataField, ParentItemReferenceField} from "../../../fields/item";
import {K4ItemSubType, K4RollResult} from "../../../scripts/enums";
import fields = foundry.data.fields;

export function ItemSchemaComponent_Base() {
  return {
    subType: new fields.StringField({required: true, choices: Object.values(K4ItemSubType)}),
    gmNotes: new fields.StringField({}),
    shortDesc: new fields.StringField({}),
    traitNotesTarget: new fields.StringField({}),
  }
}

export function ItemSchemaComponent_CanBeSubItem() {
  return {
    parentItem: ParentItemReferenceField(false)
  }
}

export function ItemSchemaComponent_IsSubItem() {
  return {
    chatName: new fields.StringField(),
    parentItem: ParentItemReferenceField(true)
  }
}

export function ItemSchemaComponent_HasSubItems() {
  return {
    subItems: new fields.ArrayField(new fields.EmbeddedDataField())
  }
}

export function ItemSchemaComponent_RulesData() {
  return {
    rules: new fields.SchemaField({
      intro: new fields.HTMLField(),
      trigger: new fields.HTMLField(),
      outro: new fields.HTMLField(),
      listRefs: new fields.ArrayField(new fields.StringField()),
      // effects: K4ActiveEffect.BuildData[],
      holdText: new fields.HTMLField()
    })
  }
}

export function ItemSchemaComponent_ResultData() {
  return {
    result: new fields.StringField(),
    listRefs: new fields.ArrayField(new fields.StringField()),
    // effects: K4ActiveEffect.BuildData[],
    edges: new fields.NumberField()
  }
}

export function ItemSchemaComponent_ResultsData() {
  return {
    results: new fields.SchemaField({
      [K4RollResult.completeSuccess]: new fields.SchemaField(ItemSchemaComponent_ResultData(), {required: false}),
      [K4RollResult.partialSuccess]: new fields.SchemaField(ItemSchemaComponent_ResultData(), {required: false}),
      [K4RollResult.failure]: new fields.SchemaField(ItemSchemaComponent_ResultData(), {required: false}),
      triggered: new fields.SchemaField(ItemSchemaComponent_ResultData(), {required: false})
    })
  }
}
