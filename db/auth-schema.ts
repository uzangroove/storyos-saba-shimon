import { pgEnum, pgTable, uuid, varchar, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const appUserRole = pgEnum("app_user_role", ["ADMIN", "OPERATOR"]);

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: uuid("auth_user_id").notNull(),
  email: varchar("email", { length: 240 }).notNull(),
  displayName: varchar("display_name", { length: 240 }),
  role: appUserRole("role").notNull().default("OPERATOR"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("app_users_auth_user_unique").on(t.authUserId),
  uniqueIndex("app_users_email_unique").on(t.email),
]);
