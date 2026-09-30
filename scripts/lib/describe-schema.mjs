// A comparable description of a database's `public` schema, read from the
// Postgres catalog: one line per column, constraint, index and enum.
//
// Order-insensitive on purpose. A migration's `ADD COLUMN` lands at the end of
// the table while `db:push` follows the schema file's order — both are the
// same schema, so column position is not part of the description.

/** @param {import('postgres').Sql} sql */
export async function describeSchema(sql) {
  const columns = await sql`
    SELECT c.relname AS table, a.attname AS name,
           format_type(a.atttypid, a.atttypmod) AS type,
           a.attnotnull AS not_null,
           pg_get_expr(d.adbin, d.adrelid) AS default
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND a.attnum > 0 AND NOT a.attisdropped`;

  const constraints = await sql`
    SELECT c.relname AS table, con.conname AS name,
           pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'`;

  const indexes = await sql`
    SELECT tablename AS table, indexname AS name, indexdef AS definition
    FROM pg_indexes WHERE schemaname = 'public'`;

  const enums = await sql`
    SELECT t.typname AS name,
           string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname`;

  return [
    ...columns.map(
      (c) =>
        `column     ${c.table}.${c.name} ${c.type}` +
        `${c.not_null ? ' NOT NULL' : ''}${c.default ? ` DEFAULT ${c.default}` : ''}`,
    ),
    ...constraints.map(
      (c) => `constraint ${c.table}.${c.name} ${c.definition}`,
    ),
    ...indexes.map((i) => `index      ${i.table}.${i.name} ${i.definition}`),
    ...enums.map((e) => `enum       ${e.name} (${e.labels})`),
  ].sort();
}

/** Lines only in `a`, and lines only in `b`. */
export function diffDescriptions(a, b) {
  const inB = new Set(b);
  const inA = new Set(a);
  return {
    onlyInA: a.filter((line) => !inB.has(line)),
    onlyInB: b.filter((line) => !inA.has(line)),
  };
}
