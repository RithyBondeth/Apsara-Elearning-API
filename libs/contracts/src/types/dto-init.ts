/**
 * Initializer type for response DTO constructors. Response DTOs are built from
 * Drizzle rows whose nullable columns are `T | null` and whose json columns are
 * `unknown`, while the DTO fields are declared as their public shapes. `DtoInit`
 * relaxes value types at the mapping boundary (keeping the key set) so
 * `new XResponseDTO(row)` type-checks without hand-mapping every column.
 */
export type DtoInit<T> = { [K in keyof T]?: unknown };
