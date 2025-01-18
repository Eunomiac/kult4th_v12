import {ItemSchemaComponent_Base, ItemSchemaComponent_CanBeSubItem, type ItemDerivedData_Base, type ItemDerivedData_CanBeSubItem} from "./Components/ItemSchema_Components";
import {ValueMaxField} from "./Fields/UtilityFields";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const ItemSchemaRelation = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_CanBeSubItem(),
  target: new fields.DocumentUUIDField({required: false, collection: "actors"}),
  concept: new fields.StringField(),
  strength: ValueMaxField(0, 0, 2)
}

type ItemDerivedData_Relation = ItemDerivedData_Base & ItemDerivedData_CanBeSubItem;

export default class ItemDataModel_Relation extends TypeDataModel<typeof ItemSchemaRelation, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Relation>> {
  static override defineSchema() {
    return ItemSchemaRelation;
  }
}
