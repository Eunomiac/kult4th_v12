
import fields = foundry.data.fields;
import {ItemSchemaComponent_Base, ItemSchemaComponent_CanBeSubItem, ItemSchemaComponent_RulesData, ItemSchemaComponent_ResultsData, type ItemDerivedData_Base, type ItemDerivedData_CanBeSubItem, type ItemDerivedData_RulesData, type ItemDerivedData_ResultsData} from "./Components/ItemSchema_Components";
import TypeDataModel = foundry.abstract.TypeDataModel;
import {K4Attribute} from "../../scripts/enums";
import type {EmptyObject, InterfaceToObject} from "fvtt-types/utils";

const ItemSchemaMove = {
  ...ItemSchemaComponent_Base(),
  ...ItemSchemaComponent_CanBeSubItem(),
  ...ItemSchemaComponent_RulesData(),
  ...ItemSchemaComponent_ResultsData(),
  attribute: new fields.StringField({required: true, choices: Object.values(K4Attribute)})
}

type ItemDerivedData_Move = ItemDerivedData_Base & ItemDerivedData_CanBeSubItem & ItemDerivedData_RulesData & ItemDerivedData_ResultsData;

export default class ItemDataModel_Move extends TypeDataModel<typeof ItemSchemaMove, Item.Implementation, EmptyObject, InterfaceToObject<ItemDerivedData_Move>> {
  static override defineSchema() {
    return ItemSchemaMove;
  }
}
