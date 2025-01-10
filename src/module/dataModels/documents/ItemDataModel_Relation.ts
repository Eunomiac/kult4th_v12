import {ItemSchemaComponent_Base, type ItemDerivedData_Base, type ItemDerivedData_CanBeSubItem} from "./Components/ItemSchema_Components";
import {ValueMaxField} from "./Fields/UtilityFields";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const ItemSchema_Relation = {
  ...ItemSchemaComponent_Base(),
  target: new fields.DocumentUUIDField({required: false, collection: "actors"}),
  concept: new fields.StringField(),
  strength: ValueMaxField(0, 0, 2)
}

type ItemDerivedData_Relation = ItemDerivedData_Base & ItemDerivedData_CanBeSubItem;

export default class ItemDataModel_Relation extends TypeDataModel<typeof ItemSchema_Relation, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Relation>> {
  static override defineSchema(): typeof ItemSchema_Relation {
    return ItemSchema_Relation;
  }
}
