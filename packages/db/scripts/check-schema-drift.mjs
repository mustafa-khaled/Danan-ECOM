#!/usr/bin/env node
/**
 * Fails when the migrated database and schema.prisma disagree.
 *
 * This catches the class of bug where a field is added to schema.prisma without a
 * migration: `prisma generate` happily produces a client that queries a column
 * `prisma migrate deploy` never created, and the failure only shows up at runtime
 * as P2022. `mustChangePassword` shipped exactly that way.
 *
 * A plain `prisma migrate diff --exit-code` cannot be used directly, because this
 * schema also relies on partial unique indexes that Prisma cannot express. Those
 * are permanent, intentional drift, so they are allowlisted by name here and
 * anything else in the diff fails the build.
 *
 * Run against a database that has just had `prisma migrate deploy` applied.
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Index names that exist only in SQL migrations because they are partial.
 * Each one is documented on its model in schema.prisma. The diff wants to drop
 * them (the schema does not mention them); that is expected.
 */
const SQL_ONLY_INDEXES = [
  "one_current_owner_per_piece",
  "ownership_record_current_idx",
  "one_active_certificate_per_piece",
  "one_active_transfer_per_piece",
  "one_default_class",
];

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaPath = join(packageRoot, "prisma", "schema.prisma");

if (!process.env.DATABASE_URL) {
  console.error("check-schema-drift: DATABASE_URL is required");
  process.exit(1);
}

let diff;
try {
  diff = execFileSync(
    "prisma",
    [
      "migrate",
      "diff",
      "--from-schema-datasource",
      schemaPath,
      "--to-schema-datamodel",
      schemaPath,
      "--script",
    ],
    { encoding: "utf8", cwd: packageRoot, stdio: ["ignore", "pipe", "inherit"] },
  );
} catch (error) {
  console.error("check-schema-drift: prisma migrate diff failed");
  process.exit(error.status ?? 1);
}

const statements = diff
  .split(";")
  .map((statement) => {
    // Strip SQL comments so an allowlisted name in a comment cannot mask a
    // statement that is not allowlisted.
    return statement
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .trim();
  })
  .filter(Boolean);

const unexpected = statements.filter(
  (statement) => !SQL_ONLY_INDEXES.some((name) => statement.includes(`"${name}"`)),
);

if (unexpected.length === 0) {
  console.log("check-schema-drift: database matches schema.prisma");
  process.exit(0);
}

console.error(
  "check-schema-drift: the migrated database does not match schema.prisma.\n" +
    "Generate a migration for these changes (pnpm db:migrate), or, if the object\n" +
    "genuinely cannot be expressed in Prisma, add it to SQL_ONLY_INDEXES with a\n" +
    "note on its model.\n",
);
for (const statement of unexpected) {
  console.error(`${statement};\n`);
}
process.exit(1);
