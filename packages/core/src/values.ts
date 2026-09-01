export function keysOf<T extends object>(
  record: T,
): readonly Extract<keyof T, string>[] {
  return Object.freeze(Object.keys(record) as Extract<keyof T, string>[]);
}
