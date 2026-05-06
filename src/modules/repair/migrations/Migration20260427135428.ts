import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260427135428 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" drop constraint if exists "repair_ticket_ticket_number_unique";`,
    );
    this.addSql(
      `alter table if exists "device" drop constraint if exists "device_serial_number_unique";`,
    );
    this.addSql(
      `create table if not exists "device" ("id" text not null, "serial_number" text not null, "model_name" text not null, "brand" text not null, "customer_id" text null, "imei" text null, "condition" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "device_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_device_serial_number_unique" ON "device" ("serial_number") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_device_deleted_at" ON "device" ("deleted_at") WHERE deleted_at IS NULL;`,
    );

    this.addSql(
      `create table if not exists "repair_ticket" ("id" text not null, "ticket_number" text not null, "device_id" text not null, "customer_id" text null, "status" text check ("status" in ('received', 'diagnosing', 'awaiting_approval', 'repairing', 'ready', 'completed', 'cancelled')) not null default 'received', "issue_description" text not null, "accessories" text null, "parts_estimate" numeric not null default 0, "labor_estimate" numeric not null default 0, "total_estimate" numeric not null default 0, "parts_actual" numeric not null default 0, "labor_actual" numeric not null default 0, "total_actual" numeric not null default 0, "is_approved" boolean not null default false, "approved_at" timestamptz null, "warranty_months" integer not null default 3, "warranty_expiry" timestamptz null, "estimated_completion" timestamptz null, "completed_at" timestamptz null, "collected_at" timestamptz null, "metadata" jsonb null, "raw_parts_estimate" jsonb not null default '{"value":"0","precision":20}', "raw_labor_estimate" jsonb not null default '{"value":"0","precision":20}', "raw_total_estimate" jsonb not null default '{"value":"0","precision":20}', "raw_parts_actual" jsonb not null default '{"value":"0","precision":20}', "raw_labor_actual" jsonb not null default '{"value":"0","precision":20}', "raw_total_actual" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_ticket_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_ticket_ticket_number_unique" ON "repair_ticket" ("ticket_number") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_repair_ticket_device_id" ON "repair_ticket" ("device_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_repair_ticket_deleted_at" ON "repair_ticket" ("deleted_at") WHERE deleted_at IS NULL;`,
    );

    this.addSql(
      `create table if not exists "repair_note" ("id" text not null, "repair_ticket_id" text not null, "content" text not null, "is_internal" boolean not null default false, "author_id" text null, "author_type" text check ("author_type" in ('user', 'customer')) null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_note_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_repair_note_repair_ticket_id" ON "repair_note" ("repair_ticket_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_repair_note_deleted_at" ON "repair_note" ("deleted_at") WHERE deleted_at IS NULL;`,
    );

    this.addSql(
      `create table if not exists "repair_media" ("id" text not null, "repair_ticket_id" text not null, "file_url" text not null, "file_name" text not null, "file_type" text check ("file_type" in ('image', 'video')) not null default 'image', "mime_type" text null, "file_size" integer null, "description" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_media_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_repair_media_repair_ticket_id" ON "repair_media" ("repair_ticket_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_repair_media_deleted_at" ON "repair_media" ("deleted_at") WHERE deleted_at IS NULL;`,
    );

    this.addSql(
      `create table if not exists "repair_update" ("id" text not null, "repair_ticket_id" text not null, "message" text not null, "author_id" text null, "author_type" text check ("author_type" in ('user', 'customer')) null, "is_read" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_update_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_repair_update_repair_ticket_id" ON "repair_update" ("repair_ticket_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_repair_update_deleted_at" ON "repair_update" ("deleted_at") WHERE deleted_at IS NULL;`,
    );

    this.addSql(
      `alter table if exists "repair_ticket" add constraint "repair_ticket_device_id_foreign" foreign key ("device_id") references "device" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table if exists "repair_note" add constraint "repair_note_repair_ticket_id_foreign" foreign key ("repair_ticket_id") references "repair_ticket" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table if exists "repair_media" add constraint "repair_media_repair_ticket_id_foreign" foreign key ("repair_ticket_id") references "repair_ticket" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table if exists "repair_update" add constraint "repair_update_repair_ticket_id_foreign" foreign key ("repair_ticket_id") references "repair_ticket" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "repair_ticket" drop constraint if exists "repair_ticket_device_id_foreign";`,
    );

    this.addSql(
      `alter table if exists "repair_note" drop constraint if exists "repair_note_repair_ticket_id_foreign";`,
    );

    this.addSql(
      `alter table if exists "repair_media" drop constraint if exists "repair_media_repair_ticket_id_foreign";`,
    );

    this.addSql(
      `alter table if exists "repair_update" drop constraint if exists "repair_update_repair_ticket_id_foreign";`,
    );

    this.addSql(`drop table if exists "device" cascade;`);

    this.addSql(`drop table if exists "repair_ticket" cascade;`);

    this.addSql(`drop table if exists "repair_note" cascade;`);

    this.addSql(`drop table if exists "repair_media" cascade;`);

    this.addSql(`drop table if exists "repair_update" cascade;`);
  }
}
