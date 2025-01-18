import {ListDataField, ParentItemReferenceField} from "../Fields/ItemFields";
import {K4ItemSubType, K4RollResult, K4ItemType} from "../../../scripts/enums";
import ItemDataModel_Move from "../ItemDataModel_Move";
import fields = foundry.data.fields;

export function ItemSchemaComponent_Base() {
  return {
    subType: new fields.StringField({required: true, choices: Object.values(K4ItemSubType)}),
    gmNotes: new fields.StringField({}),
    shortDesc: new fields.StringField({}),
    traitNotesTarget: new fields.StringField({}),
  }
}

export interface ItemDerivedData_Base {

}

export function ItemSchemaComponent_CanBeSubItem() {
  return {
    parentItemRef: ParentItemReferenceField(false)
  }
}

export interface ItemDerivedData_CanBeSubItem {
  parentItem: K4ItemClass.Parent
}

export function ItemSchemaComponent_IsSubItem() {
  return {
    chatName: new fields.StringField(),
    parentItemRef: ParentItemReferenceField(true)
  }
}

export interface ItemDerivedData_IsSubItem {
  parentItem: K4ItemClass.Parent
}

export function ItemSchemaComponent_HasSubItems() {
  return {
    subItemData: new fields.ArrayField(new fields.EmbeddedDataField(ItemDataModel_Move))
  }
}

export interface ItemDerivedData_HasSubItems {
  subItems: K4ItemOfType<K4ItemType.move>[]
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

export interface ItemDerivedData_RulesData {

}

export function ItemSchemaComponent_ResultData() {
  return {
    result: new fields.StringField(),
    listRefs: new fields.ArrayField(new fields.StringField()),
    // effects: K4ActiveEffect.BuildData[],
    edges: new fields.NumberField()
  }
}

export interface ItemDerivedData_ResultData {

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

export interface ItemDerivedData_ResultsData {

}
