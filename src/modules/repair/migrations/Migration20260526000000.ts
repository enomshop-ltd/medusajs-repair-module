import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260526000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" alter column "custom_parts" drop not null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" alter column "custom_parts" set not null;`,
    );
  }
}
