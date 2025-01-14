import {ItemSchemaComponent_Base, ItemSchemaComponent_CanBeSubItem, ItemSchemaComponent_RulesData, ItemSchemaComponent_ResultsData, type ItemDerivedData_Base, type ItemDerivedData_CanBeSubItem, type ItemDerivedData_RulesData, type ItemDerivedData_ResultsData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import {K4Attribute} from "../../scripts/enums";
import fields = foundry.data.fields;
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";


const getItemSchema_Move = () => ({
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_CanBeSubItem(),
  ...ItemSchemaComponent_RulesData(),
  ...ItemSchemaComponent_ResultsData(),
  attribute: new fields.StringField({required: true, choices: Object.values(K4Attribute)})
})

type ItemSchema_Move = ReturnType<typeof getItemSchema_Move>;

type ItemDerivedData_Move = ItemDerivedData_Base & ItemDerivedData_CanBeSubItem & ItemDerivedData_RulesData & ItemDerivedData_ResultsData;

export default class ItemDataModel_Move extends TypeDataModel<ItemSchema_Move, Item.ConfiguredInstance, EmptyObject, InterfaceToObject<ItemDerivedData_Move>> {
  private static _definedSchema: Maybe<ItemSchema_Move>;
  static override defineSchema(): ItemSchema_Move {
    if (!ItemDataModel_Move._definedSchema) {
      ItemDataModel_Move._definedSchema = getItemSchema_Move();
    }
    return ItemDataModel_Move._definedSchema;
  }
}
