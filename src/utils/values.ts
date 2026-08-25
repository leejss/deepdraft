export function keysOf<T extends object>(
  record: T,
): readonly Extract<keyof T, string>[] {
  return Object.freeze(Object.keys(record) as Extract<keyof T, string>[]);
}

// Extract<keyof T, string> is a TypeScript utility type that extracts the keys of an object type T that are assignable to the string type. In other words, it filters out any keys that are not strings (e.g., symbols or numbers) and returns only the string keys.

export function valuesOf<T extends object>(record: T): readonly T[keyof T][] {
  return Object.freeze(Object.values(record) as T[keyof T][]);
}

// T[keyof T] is a TypeScript utility type that represents the union of all the value types of an object type T. In other words, it extracts the types of all the values in the object and creates a new type that is a union of those types.
