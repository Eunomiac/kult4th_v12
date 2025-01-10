import fields = foundry.data.fields;

export function ModDefField() {
  return new fields.ObjectField({
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return false;
      }
      if (Object.entries(value).some(([key, val]: unknown[]) => typeof key !== "string" || typeof val !== "number")) {
        return false;
      }
    }
  });
}
