import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260506000002 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" add column if not exists "approval_token" text null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" drop column if exists "approval_token";`,
    );
  }
}
