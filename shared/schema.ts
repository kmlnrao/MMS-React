import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from 'drizzle-orm';
import { z } from "zod";

// ==================== User & Auth ====================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().$type<"admin" | "medical_staff" | "mortuary_staff" | "viewer">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User relations are defined after all tables have been declared to avoid reference errors
// See bottom of file for usersRelations

// ==================== Deceased Patients ====================
export const deceasedPatients = pgTable("deceased_patients", {
  id: serial("id").primaryKey(),
  mrNumber: varchar("mr_number", { length: 20 }).notNull().unique(), // MR-YYYY-XXXX
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull().$type<"male" | "female" | "other">(),
  dateOfDeath: timestamp("date_of_death").notNull(),
  causeOfDeath: text("cause_of_death").notNull(),
  wardFrom: text("ward_from").notNull(),
  attendingPhysician: text("attending_physician").notNull(),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  registeredById: integer("registered_by_id").references(() => users.id, { onDelete: 'set null' }),
  notes: text("notes"),
  status: text("status").notNull().$type<"registered" | "pending_autopsy" | "autopsy_completed" | "pending_release" | "released" | "unclaimed">(),
  documents: jsonb("documents").$type<string[]>(),
});

// Deceased patient relations are defined after all tables have been declared to avoid reference errors
// See bottom of file for deceasedPatientsRelations

// ==================== Storage Units ====================
export const storageUnits = pgTable("storage_units", {
  id: serial("id").primaryKey(),
  unitNumber: varchar("unit_number", { length: 10 }).notNull().unique(), // A-01, B-05, etc.
  section: varchar("section", { length: 5 }).notNull(), // A, B, C, etc.
  temperature: integer("temperature"), // Current temperature in celsius
  status: text("status").notNull().$type<"available" | "occupied" | "maintenance">(),
  lastMaintenance: timestamp("last_maintenance"),
  notes: text("notes"),
});

// Storage unit relations are defined after all tables have been declared to avoid reference errors
// See bottom of file for storageUnitsRelations

// ==================== Storage Assignments ====================
export const storageAssignments = pgTable("storage_assignments", {
  id: serial("id").primaryKey(),
  deceasedId: integer("deceased_id").notNull().references(() => deceasedPatients.id, { onDelete: 'cascade' }).unique(),
  storageUnitId: integer("storage_unit_id").notNull().references(() => storageUnits.id, { onDelete: 'restrict' }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedById: integer("assigned_by_id").references(() => users.id, { onDelete: 'set null' }),
  releaseDate: timestamp("release_date"),
  status: text("status").notNull().$type<"active" | "released">(),
});

export const storageAssignmentsRelations = relations(storageAssignments, ({ one }) => ({
  deceased: one(deceasedPatients, {
    fields: [storageAssignments.deceasedId],
    references: [deceasedPatients.id],
  }),
  storageUnit: one(storageUnits, {
    fields: [storageAssignments.storageUnitId],
    references: [storageUnits.id],
  }),
  assignedBy: one(users, {
    fields: [storageAssignments.assignedById],
    references: [users.id],
  }),
}));

// ==================== Postmortems ====================
export const postmortems = pgTable("postmortems", {
  id: serial("id").primaryKey(),
  deceasedId: integer("deceased_id").notNull().references(() => deceasedPatients.id, { onDelete: 'cascade' }).unique(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: 'set null' }),
  findings: text("findings"),
  images: jsonb("images").$type<string[]>(),
  status: text("status").notNull().$type<"scheduled" | "in_progress" | "completed" | "cancelled">(),
  isForensic: boolean("is_forensic").default(false).notNull(),
  notes: text("notes"),
});

export const postmortemsRelations = relations(postmortems, ({ one }) => ({
  deceased: one(deceasedPatients, {
    fields: [postmortems.deceasedId],
    references: [deceasedPatients.id],
  }),
  assignedTo: one(users, {
    fields: [postmortems.assignedToId],
    references: [users.id],
  }),
}));

// ==================== Body Release Requests ====================
export const bodyReleaseRequests = pgTable("body_release_requests", {
  id: serial("id").primaryKey(),
  deceasedId: integer("deceased_id").notNull().references(() => deceasedPatients.id, { onDelete: 'cascade' }).unique(),
  requestDate: timestamp("request_date").defaultNow().notNull(),
  requestedById: integer("requested_by_id").references(() => users.id, { onDelete: 'set null' }),
  nextOfKinName: text("next_of_kin_name").notNull(),
  nextOfKinRelation: text("next_of_kin_relation").notNull(),
  nextOfKinContact: text("next_of_kin_contact").notNull(),
  identityVerified: boolean("identity_verified").default(false).notNull(),
  approvalStatus: text("approval_status").notNull().$type<"pending" | "approved" | "rejected">(),
  approvedById: integer("approved_by_id").references(() => users.id, { onDelete: 'set null' }),
  approvalDate: timestamp("approval_date"),
  releaseDate: timestamp("release_date"),
  transferredTo: text("transferred_to"), // Funeral home or other entity
  documents: jsonb("documents").$type<string[]>(),
  notes: text("notes"),
});

export const bodyReleaseRequestsRelations = relations(bodyReleaseRequests, ({ one }) => ({
  deceased: one(deceasedPatients, {
    fields: [bodyReleaseRequests.deceasedId],
    references: [deceasedPatients.id],
  }),
  requestedBy: one(users, {
    fields: [bodyReleaseRequests.requestedById],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [bodyReleaseRequests.approvedById],
    references: [users.id],
  }),
}));

// ==================== Tasks ====================
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: 'set null' }),
  priority: text("priority").notNull().$type<"urgent" | "medium" | "routine">(),
  status: text("status").notNull().$type<"pending" | "in_progress" | "completed" | "cancelled">(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  relatedEntityType: text("related_entity_type").$type<"deceased" | "storage" | "postmortem" | "release" | "other">(),
  relatedEntityId: integer("related_entity_id"),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
  }),
}));

// ==================== System Alerts ====================
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().$type<"temperature" | "storage" | "system" | "maintenance" | "other">(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().$type<"critical" | "warning" | "info">(),
  status: text("status").notNull().$type<"active" | "acknowledged" | "resolved">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acknowledgedById: integer("acknowledged_by_id").references(() => users.id, { onDelete: 'set null' }),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedById: integer("resolved_by_id").references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp("resolved_at"),
  relatedEntityType: text("related_entity_type").$type<"deceased" | "storage_unit" | "postmortem" | "release" | "other">(),
  relatedEntityId: integer("related_entity_id"),
});

export const systemAlertsRelations = relations(systemAlerts, ({ one }) => ({
  acknowledgedBy: one(users, {
    fields: [systemAlerts.acknowledgedById],
    references: [users.id],
  }),
  resolvedBy: one(users, {
    fields: [systemAlerts.resolvedById],
    references: [users.id],
  }),
}));

// ==================== Insert Schemas ====================

// Users
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Deceased Patients
export const insertDeceasedPatientSchema = createInsertSchema(deceasedPatients)
  .omit({ id: true, registrationDate: true });
export type InsertDeceasedPatient = z.infer<typeof insertDeceasedPatientSchema>;
export type DeceasedPatient = typeof deceasedPatients.$inferSelect;

// Storage Units
export const insertStorageUnitSchema = createInsertSchema(storageUnits)
  .omit({ id: true });
export type InsertStorageUnit = z.infer<typeof insertStorageUnitSchema>;
export type StorageUnit = typeof storageUnits.$inferSelect;

// Storage Assignments
export const insertStorageAssignmentSchema = createInsertSchema(storageAssignments)
  .omit({ id: true, assignedAt: true });
export type InsertStorageAssignment = z.infer<typeof insertStorageAssignmentSchema>;
export type StorageAssignment = typeof storageAssignments.$inferSelect;

// Postmortems
export const insertPostmortemSchema = createInsertSchema(postmortems)
  .omit({ id: true });
export type InsertPostmortem = z.infer<typeof insertPostmortemSchema>;
export type Postmortem = typeof postmortems.$inferSelect;

// Body Release Requests
export const insertBodyReleaseRequestSchema = createInsertSchema(bodyReleaseRequests)
  .omit({ id: true, requestDate: true });
export type InsertBodyReleaseRequest = z.infer<typeof insertBodyReleaseRequestSchema>;
export type BodyReleaseRequest = typeof bodyReleaseRequests.$inferSelect;

// Tasks
export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, completedAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// System Alerts
export const insertSystemAlertSchema = createInsertSchema(systemAlerts)
  .omit({ id: true, createdAt: true, acknowledgedAt: true, resolvedAt: true });
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;

// ==================== Relations that needed to be defined after all tables ====================

// Define user relations after all tables are created
export const usersRelations = relations(users, ({ many }) => ({
  deceasedRegistrations: many(deceasedPatients),
  postmortems: many(postmortems),
  bodyReleases: many(bodyReleaseRequests),
}));

// Define deceased patient relations after all tables are created
export const deceasedPatientsRelations = relations(deceasedPatients, ({ one, many }) => ({
  registeredBy: one(users, {
    fields: [deceasedPatients.registeredById],
    references: [users.id],
  }),
  storageAssignment: one(storageAssignments, {
    fields: [deceasedPatients.id],
    references: [storageAssignments.deceasedId],
  }),
  postmortem: one(postmortems, {
    fields: [deceasedPatients.id],
    references: [postmortems.deceasedId]
  }),
  releaseRequest: one(bodyReleaseRequests, {
    fields: [deceasedPatients.id],
    references: [bodyReleaseRequests.deceasedId]
  }),
}));

// Define storage units relations after all tables are created
export const storageUnitsRelations = relations(storageUnits, ({ many }) => ({
  assignments: many(storageAssignments),
}));
