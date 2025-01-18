import fields = foundry.data.fields;
import {ListDataField, ParentItemReferenceField} from "../Fields/ItemFields";
import {K4ItemSubType, K4RollResult, K4ItemType} from "../../../scripts/enums";
import ItemDataModel_Move from "../ItemDataModel_Move";

export function ItemSchemaComponent_Base() {
  return {
    subType: new foundry.data.fields.StringField({required: true, choices: Object.values(K4ItemSubType)}),
    gmNotes: new foundry.data.fields.StringField({}),
    shortDesc: new foundry.data.fields.StringField({}),
    traitNotesTarget: new foundry.data.fields.StringField({}),
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
    chatName: new foundry.data.fields.StringField(),
    parentItemRef: ParentItemReferenceField(true)
  }
}

export interface ItemDerivedData_IsSubItem {
  parentItem: K4ItemClass.Parent
}

export function ItemSchemaComponent_HasSubItems() {
  return {
    subItemData: new foundry.data.fields.ArrayField(new foundry.data.fields.ObjectField())
  }
}

export interface ItemDerivedData_HasSubItems {
  subItems: K4ItemOfType<K4ItemType.move>[]
}

export function ItemSchemaComponent_RulesData() {
  return {
    rules: new foundry.data.fields.SchemaField({
      intro: new foundry.data.fields.HTMLField(),
      trigger: new foundry.data.fields.HTMLField(),
      outro: new foundry.data.fields.HTMLField(),
      listRefs: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField()),
      // effects: K4ActiveEffect.BuildData[],
      holdText: new foundry.data.fields.HTMLField()
    })
  }
}

export interface ItemDerivedData_RulesData {

}

export function ItemSchemaComponent_ResultData() {
  return {
    result: new foundry.data.fields.StringField(),
    listRefs: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField()),
    // effects: K4ActiveEffect.BuildData[],
    edges: new foundry.data.fields.NumberField()
  }
}

export interface ItemDerivedData_ResultData {

}

export function ItemSchemaComponent_ResultsData() {
  return {
    results: new foundry.data.fields.SchemaField({
      [K4RollResult.completeSuccess]: new foundry.data.fields.SchemaField(ItemSchemaComponent_ResultData(), {required: false}),
      [K4RollResult.partialSuccess]: new foundry.data.fields.SchemaField(ItemSchemaComponent_ResultData(), {required: false}),
      [K4RollResult.failure]: new foundry.data.fields.SchemaField(ItemSchemaComponent_ResultData(), {required: false}),
      triggered: new foundry.data.fields.SchemaField(ItemSchemaComponent_ResultData(), {required: false})
    })
  }
}

export interface ItemDerivedData_ResultsData {

}
