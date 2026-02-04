export interface TypedFormData<T extends object> extends FormData {
  append<K extends keyof T>(name: K, value: T[K]): void;
}

export function typedForm<T extends object>(data: T): TypedFormData<T> {
  const form = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const innerValue of value) {
        form.append(key, innerValue);
      }
    } else {
      form.append(key, value);
    }
  }

  return form;
}
