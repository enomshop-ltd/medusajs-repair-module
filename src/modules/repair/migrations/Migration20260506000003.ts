import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260506000003 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" add column if not exists "terms_accepted" boolean not null default false;`,
    );
    this.addSql(
      `alter table if exists "repair_ticket" add column if not exists "data_wiped_consent" boolean not null default false;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" drop column if exists "terms_accepted";`,
    );
    this.addSql(
      `alter table if exists "repair_ticket" drop column if exists "data_wiped_consent";`,
    );
  }
}
