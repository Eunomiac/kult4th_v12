import fields = foundry.data.fields;

export function ValueMaxField(initialValue = 0, min = 0, max = 0, hasName?: string, required = true) {
  const theseFields = {
    value: new fields.NumberField({required: true, initial: initialValue, step: 1, integer: true}),
    min: new fields.NumberField({required: true, initial: min, step: 1, integer: true}),
    max: new fields.NumberField({required: true, initial: max, step: 1, integer: true}),
  };
  return hasName
    ? new fields.SchemaField({name: new fields.StringField({required: true, initial: hasName}), ...theseFields}, {required})
    : new fields.SchemaField(theseFields, {required});
}
