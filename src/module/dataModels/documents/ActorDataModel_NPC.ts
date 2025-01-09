import TypeDataModel = foundry.abstract.TypeDataModel;
import fields = foundry.data.fields;

const ActorSchema_NPC = {
  description: new fields.HTMLField({
    required: true,
    blank: true,
    initial: "",
    label: "Description"
  }),
  notes: new fields.HTMLField({
    required: true,
    blank: true,
    initial: "",
    label: "Notes"
  })
}

export default class ActorDataModel_NPC extends TypeDataModel<typeof ActorSchema_NPC, Actor.ConfiguredInstance> {
  static override defineSchema(): typeof ActorSchema_NPC {
    return ActorSchema_NPC;
  }
}
