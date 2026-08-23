import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  date,
  time,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const institutionType = pgEnum("institution_type", [
  "MUNICIPAL_KINDERGARTEN",
  "PRIVATE_KINDERGARTEN",
  "DAYCARE",
  "NURSERY",
  "FAMILY_DAYCARE",
  "SCHOOL",
  "OTHER",
]);

export const verificationStatus = pgEnum("verification_status", [
  "OFFICIAL",
  "VERIFIED",
  "PARTIAL",
  "NEEDS_VERIFICATION",
  "UNVERIFIED",
]);

export const crmStatus = pgEnum("crm_status", [
  "PROSPECT",
  "CONTACTED",
  "MEETING",
  "QUOTE_SENT",
  "WON",
  "ACTIVE",
  "LOST",
  "INACTIVE",
]);

export const sessionStatus = pgEnum("session_status", [
  "PLANNED",
  "COMPLETED",
  "CANCELLED",
  "POSTPONED",
  "HOLIDAY",
  "NO_SCHOOL",
  "PENDING",
]);

export const attendanceStatus = pgEnum("attendance_status", [
  "NOT_STARTED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "REVIEW_REQUIRED",
  "APPROVED",
]);

export const institutions = pgTable("institutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  legacySourceId: varchar("legacy_source_id", { length: 80 }),
  name: varchar("name", { length: 240 }).notNull(),
  type: institutionType("type").notNull().default("OTHER"),
  ownership: varchar("ownership", { length: 240 }),
  ageRangeText: varchar("age_range_text", { length: 120 }),
  address: varchar("address", { length: 320 }),
  neighborhood: varchar("neighborhood", { length: 180 }),
  city: varchar("city", { length: 160 }).notNull().default("כרמיאל"),
  phone: varchar("phone", { length: 80 }),
  email: varchar("email", { length: 240 }),
  website: text("website"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  educationStream: varchar("education_stream", { length: 160 }),
  childCount: integer("child_count"),
  verificationStatus: verificationStatus("verification_status").notNull().default("UNVERIFIED"),
  sourceName: varchar("source_name", { length: 240 }),
  sourceUrl: text("source_url"),
  sourceCheckedAt: timestamp("source_checked_at", { withTimezone: true }),
  crmStatus: crmStatus("crm_status").notNull().default("PROSPECT"),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("institutions_city_idx").on(t.city),
  index("institutions_crm_status_idx").on(t.crmStatus),
  index("institutions_verification_idx").on(t.verificationStatus),
]);

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 160 }),
  lastName: varchar("last_name", { length: 160 }),
  phone: varchar("phone", { length: 80 }),
  whatsapp: varchar("whatsapp", { length: 80 }),
  email: varchar("email", { length: 240 }),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const institutionContacts = pgTable("institution_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 160 }),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("institution_contact_unique").on(t.institutionId, t.contactId)]);

export const schoolYears = pgTable("school_years", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(false),
});

export const holidayCalendars = pgTable("holiday_calendars", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolYearId: uuid("school_year_id").notNull().references(() => schoolYears.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  sector: varchar("sector", { length: 120 }),
  sourceUrl: text("source_url"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

export const holidays = pgTable("holidays", {
  id: uuid("id").defaultRandom().primaryKey(),
  calendarId: uuid("calendar_id").notNull().references(() => holidayCalendars.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  noActivity: boolean("no_activity").notNull().default(true),
  notes: text("notes"),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 240 }).notNull(),
  category: varchar("category", { length: 160 }),
  description: text("description"),
  defaultMinutes: integer("default_minutes"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  author: varchar("author", { length: 240 }),
  publisher: varchar("publisher", { length: 240 }),
  isbn: varchar("isbn", { length: 40 }),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 80 }).notNull(),
  mediaType: varchar("media_type", { length: 80 }).notNull(),
  title: varchar("title", { length: 300 }),
  url: text("url").notNull(),
  storagePath: text("storage_path"),
  bookId: uuid("book_id").references(() => books.id, { onDelete: "set null" }),
  activityId: uuid("activity_id").references(() => activities.id, { onDelete: "set null" }),
  isPublic: boolean("is_public").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const operators = pgTable("operators", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: uuid("auth_user_id"),
  firstName: varchar("first_name", { length: 160 }).notNull(),
  lastName: varchar("last_name", { length: 160 }),
  phone: varchar("phone", { length: 80 }),
  email: varchar("email", { length: 240 }),
  photoUrl: text("photo_url"),
  active: boolean("active").notNull().default(true),
  payRate: numeric("pay_rate", { precision: 10, scale: 2 }),
  payModel: varchar("pay_model", { length: 40 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  schoolYearId: uuid("school_year_id").references(() => schoolYears.id),
  activityId: uuid("activity_id").references(() => activities.id),
  title: varchar("title", { length: 300 }).notNull(),
  pricingModel: varchar("pricing_model", { length: 80 }),
  agreedPrice: numeric("agreed_price", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("ILS"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: varchar("status", { length: 80 }).notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  activityId: uuid("activity_id").references(() => activities.id),
  operatorId: uuid("operator_id").references(() => operators.id),
  holidayCalendarId: uuid("holiday_calendar_id").references(() => holidayCalendars.id),
  weekday: integer("weekday").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to").notNull(),
  active: boolean("active").notNull().default(true),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  scheduleId: uuid("schedule_id").references(() => schedules.id, { onDelete: "set null" }),
  contractId: uuid("contract_id").references(() => contracts.id),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  activityId: uuid("activity_id").references(() => activities.id),
  operatorId: uuid("operator_id").references(() => operators.id),
  sessionDate: date("session_date").notNull(),
  plannedStart: time("planned_start").notNull(),
  plannedEnd: time("planned_end").notNull(),
  sequenceNumber: integer("sequence_number"),
  status: sessionStatus("status").notNull().default("PLANNED"),
  storyosContentRef: text("storyos_content_ref"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("sessions_date_idx").on(t.sessionDate),
  index("sessions_institution_idx").on(t.institutionId),
  uniqueIndex("sessions_schedule_date_unique").on(t.scheduleId, t.sessionDate),
]);

export const operatorAssignments = pgTable("operator_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  operatorId: uuid("operator_id").notNull().references(() => operators.id),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 120 }).notNull().default("LEAD"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceReports = pgTable("attendance_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  operatorId: uuid("operator_id").notNull().references(() => operators.id),
  status: attendanceStatus("status").notNull().default("NOT_STARTED"),
  checkInAt: timestamp("check_in_at", { withTimezone: true }),
  checkOutAt: timestamp("check_out_at", { withTimezone: true }),
  actualMinutes: integer("actual_minutes"),
  checkInLatitude: numeric("check_in_latitude", { precision: 10, scale: 7 }),
  checkInLongitude: numeric("check_in_longitude", { precision: 10, scale: 7 }),
  checkOutLatitude: numeric("check_out_latitude", { precision: 10, scale: 7 }),
  checkOutLongitude: numeric("check_out_longitude", { precision: 10, scale: 7 }),
  deviceInfo: jsonb("device_info").$type<Record<string, unknown>>().default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("attendance_session_operator_unique").on(t.sessionId, t.operatorId)]);

export const sessionReports = pgTable("session_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }).unique(),
  operatorId: uuid("operator_id").references(() => operators.id),
  summary: text("summary"),
  contentDone: text("content_done"),
  nextSessionNotes: text("next_session_notes"),
  feedback: text("feedback"),
  childCount: integer("child_count"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").notNull().references(() => institutions.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("ILS"),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  method: varchar("method", { length: 80 }),
  reference: varchar("reference", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
