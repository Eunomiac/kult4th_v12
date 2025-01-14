import {ItemSchemaComponent_Base, type ItemDerivedData_Base, type ItemDerivedData_CanBeSubItem} from "./Components/ItemSchema_Components";
import {ValueMaxField} from "./Fields/UtilityFields";
import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const getItemSchema_Relation = () => ({
  ...ItemSchemaComponent_Base(),
  target: new fields.DocumentUUIDField({required: false, collection: "actors"}),
  concept: new fields.StringField(),
  strength: ValueMaxField(0, 0, 2)
})

type ItemSchema_Relation = ReturnType<typeof getItemSchema_Relation>;

type ItemDerivedData_Relation = ItemDerivedData_Base & ItemDerivedData_CanBeSubItem;

export default class ItemDataModel_Relation extends TypeDataModel<ItemSchema_Relation, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Relation>> {
  private static _definedSchema: Maybe<ItemSchema_Relation>;
  static override defineSchema(): ItemSchema_Relation {
    if (!ItemDataModel_Relation._definedSchema) {
      ItemDataModel_Relation._definedSchema = getItemSchema_Relation();
    }
    return ItemDataModel_Relation._definedSchema;
  }
}
