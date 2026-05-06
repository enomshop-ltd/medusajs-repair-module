import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260506000001 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" add column if not exists "custom_parts" jsonb not null default '[]';`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" drop column if exists "custom_parts";`,
    );
  }
}
