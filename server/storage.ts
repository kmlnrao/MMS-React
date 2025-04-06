import { 
  users, 
  deceasedPatients, 
  storageUnits, 
  storageAssignments, 
  postmortems, 
  bodyReleaseRequests, 
  tasks, 
  systemAlerts,
  type User, 
  type InsertUser, 
  type DeceasedPatient, 
  type InsertDeceasedPatient,
  type StorageUnit,
  type InsertStorageUnit,
  type StorageAssignment,
  type InsertStorageAssignment,
  type Postmortem,
  type InsertPostmortem,
  type BodyReleaseRequest,
  type InsertBodyReleaseRequest,
  type Task,
  type InsertTask,
  type SystemAlert,
  type InsertSystemAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, asc, or, isNull, not } from "drizzle-orm";
import session, { Store } from "express-session";
import createMemoryStore from "memorystore";

// Define the storage interface
export interface IStorage {
  // Session store for authentication
  sessionStore: Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Deceased patients operations
  getAllDeceasedPatients(): Promise<DeceasedPatient[]>;
  getDeceasedPatient(id: number): Promise<DeceasedPatient | undefined>;
  createDeceasedPatient(patient: InsertDeceasedPatient): Promise<DeceasedPatient>;
  updateDeceasedPatient(id: number, data: Partial<InsertDeceasedPatient>): Promise<DeceasedPatient>;
  
  // Storage unit operations
  getAllStorageUnits(): Promise<StorageUnit[]>;
  getStorageUnit(id: number): Promise<StorageUnit | undefined>;
  createStorageUnit(unit: InsertStorageUnit): Promise<StorageUnit>;
  updateStorageUnit(id: number, data: Partial<InsertStorageUnit>): Promise<StorageUnit>;
  
  // Storage assignment operations
  getAllStorageAssignments(): Promise<StorageAssignment[]>;
  getStorageAssignment(id: number): Promise<StorageAssignment | undefined>;
  getStorageAssignmentByDeceasedId(deceasedId: number): Promise<StorageAssignment | undefined>;
  createStorageAssignment(assignment: InsertStorageAssignment): Promise<StorageAssignment>;
  updateStorageAssignment(id: number, data: Partial<InsertStorageAssignment>): Promise<StorageAssignment>;
  
  // Postmortem operations
  getAllPostmortems(): Promise<Postmortem[]>;
  getPostmortem(id: number): Promise<Postmortem | undefined>;
  createPostmortem(postmortem: InsertPostmortem): Promise<Postmortem>;
  updatePostmortem(id: number, data: Partial<InsertPostmortem>): Promise<Postmortem>;
  
  // Body release operations
  getAllBodyReleaseRequests(): Promise<BodyReleaseRequest[]>;
  getBodyReleaseRequest(id: number): Promise<BodyReleaseRequest | undefined>;
  createBodyReleaseRequest(request: InsertBodyReleaseRequest): Promise<BodyReleaseRequest>;
  updateBodyReleaseRequest(id: number, data: Partial<InsertBodyReleaseRequest>): Promise<BodyReleaseRequest>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task>;
  
  // System alert operations
  getAllSystemAlerts(): Promise<SystemAlert[]>;
  getSystemAlert(id: number): Promise<SystemAlert | undefined>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  updateSystemAlert(id: number, data: Partial<InsertSystemAlert>): Promise<SystemAlert>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    occupied: number;
    available: number;
    pendingReleases: number;
    unclaimed: number;
    recentRegistrations: DeceasedPatient[];
    pendingTasks: Task[];
    alerts: SystemAlert[];
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    // Use in-memory session storage for simplicity
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }

  // ==================== User Methods ====================
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // ==================== Deceased Patients Methods ====================
  async getAllDeceasedPatients(): Promise<DeceasedPatient[]> {
    return db.select().from(deceasedPatients).orderBy(desc(deceasedPatients.registrationDate));
  }

  async getDeceasedPatient(id: number): Promise<DeceasedPatient | undefined> {
    const [patient] = await db.select().from(deceasedPatients).where(eq(deceasedPatients.id, id));
    return patient;
  }

  async createDeceasedPatient(patient: InsertDeceasedPatient): Promise<DeceasedPatient> {
    const [createdPatient] = await db
      .insert(deceasedPatients)
      .values(patient)
      .returning();
    return createdPatient;
  }

  async updateDeceasedPatient(id: number, data: Partial<InsertDeceasedPatient>): Promise<DeceasedPatient> {
    const [updatedPatient] = await db
      .update(deceasedPatients)
      .set(data)
      .where(eq(deceasedPatients.id, id))
      .returning();
    return updatedPatient;
  }

  // ==================== Storage Units Methods ====================
  async getAllStorageUnits(): Promise<StorageUnit[]> {
    return db.select().from(storageUnits).orderBy(asc(storageUnits.unitNumber));
  }

  async getStorageUnit(id: number): Promise<StorageUnit | undefined> {
    const [unit] = await db.select().from(storageUnits).where(eq(storageUnits.id, id));
    return unit;
  }

  async createStorageUnit(unit: InsertStorageUnit): Promise<StorageUnit> {
    const [createdUnit] = await db
      .insert(storageUnits)
      .values(unit)
      .returning();
    return createdUnit;
  }

  async updateStorageUnit(id: number, data: Partial<InsertStorageUnit>): Promise<StorageUnit> {
    const [updatedUnit] = await db
      .update(storageUnits)
      .set(data)
      .where(eq(storageUnits.id, id))
      .returning();
    return updatedUnit;
  }

  // ==================== Storage Assignments Methods ====================
  async getAllStorageAssignments(): Promise<StorageAssignment[]> {
    return db.select().from(storageAssignments).orderBy(desc(storageAssignments.assignedAt));
  }

  async getStorageAssignment(id: number): Promise<StorageAssignment | undefined> {
    const [assignment] = await db.select().from(storageAssignments).where(eq(storageAssignments.id, id));
    return assignment;
  }

  async getStorageAssignmentByDeceasedId(deceasedId: number): Promise<StorageAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(storageAssignments)
      .where(eq(storageAssignments.deceasedId, deceasedId));
    return assignment;
  }

  async createStorageAssignment(assignment: InsertStorageAssignment): Promise<StorageAssignment> {
    // Begin a transaction
    const result = await db.transaction(async (tx) => {
      // Check if there's already an assignment for this deceased
      const [existingAssignment] = await tx
        .select()
        .from(storageAssignments)
        .where(eq(storageAssignments.deceasedId, assignment.deceasedId));
      
      if (existingAssignment) {
        throw new Error("Deceased patient already has an active storage assignment");
      }
      
      // Mark the storage unit as occupied
      await tx
        .update(storageUnits)
        .set({ status: "occupied" })
        .where(eq(storageUnits.id, assignment.storageUnitId));
      
      // Create the assignment
      const [newAssignment] = await tx
        .insert(storageAssignments)
        .values(assignment)
        .returning();
      
      return newAssignment;
    });
    
    return result;
  }

  async updateStorageAssignment(id: number, data: Partial<InsertStorageAssignment>): Promise<StorageAssignment> {
    // Begin a transaction
    const result = await db.transaction(async (tx) => {
      const [assignment] = await tx
        .select()
        .from(storageAssignments)
        .where(eq(storageAssignments.id, id));
      
      if (!assignment) {
        throw new Error("Storage assignment not found");
      }
      
      // If we're changing the storage unit
      if (data.storageUnitId && data.storageUnitId !== assignment.storageUnitId) {
        // Mark old unit as available
        await tx
          .update(storageUnits)
          .set({ status: "available" })
          .where(eq(storageUnits.id, assignment.storageUnitId));
        
        // Mark new unit as occupied
        await tx
          .update(storageUnits)
          .set({ status: "occupied" })
          .where(eq(storageUnits.id, data.storageUnitId));
      }
      
      // Update the assignment
      const [updatedAssignment] = await tx
        .update(storageAssignments)
        .set(data)
        .where(eq(storageAssignments.id, id))
        .returning();
      
      return updatedAssignment;
    });
    
    return result;
  }

  // ==================== Postmortem Methods ====================
  async getAllPostmortems(): Promise<Postmortem[]> {
    return db.select().from(postmortems).orderBy(desc(postmortems.scheduledDate));
  }

  async getPostmortem(id: number): Promise<Postmortem | undefined> {
    const [postmortem] = await db.select().from(postmortems).where(eq(postmortems.id, id));
    return postmortem;
  }

  async createPostmortem(postmortem: InsertPostmortem): Promise<Postmortem> {
    const [createdPostmortem] = await db
      .insert(postmortems)
      .values(postmortem)
      .returning();
    
    // Update the patient status to pending_autopsy
    await db
      .update(deceasedPatients)
      .set({ status: "pending_autopsy" })
      .where(eq(deceasedPatients.id, postmortem.deceasedId));
    
    return createdPostmortem;
  }

  async updatePostmortem(id: number, data: Partial<InsertPostmortem>): Promise<Postmortem> {
    const [updatedPostmortem] = await db
      .update(postmortems)
      .set(data)
      .where(eq(postmortems.id, id))
      .returning();
    return updatedPostmortem;
  }

  // ==================== Body Release Methods ====================
  async getAllBodyReleaseRequests(): Promise<BodyReleaseRequest[]> {
    return db.select().from(bodyReleaseRequests).orderBy(desc(bodyReleaseRequests.requestDate));
  }

  async getBodyReleaseRequest(id: number): Promise<BodyReleaseRequest | undefined> {
    const [request] = await db.select().from(bodyReleaseRequests).where(eq(bodyReleaseRequests.id, id));
    return request;
  }

  async createBodyReleaseRequest(request: InsertBodyReleaseRequest): Promise<BodyReleaseRequest> {
    const [createdRequest] = await db
      .insert(bodyReleaseRequests)
      .values(request)
      .returning();
    return createdRequest;
  }

  async updateBodyReleaseRequest(id: number, data: Partial<InsertBodyReleaseRequest>): Promise<BodyReleaseRequest> {
    const [updatedRequest] = await db
      .update(bodyReleaseRequests)
      .set(data)
      .where(eq(bodyReleaseRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // ==================== Task Methods ====================
  async getAllTasks(): Promise<Task[]> {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [createdTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return createdTask;
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  // ==================== System Alert Methods ====================
  async getAllSystemAlerts(): Promise<SystemAlert[]> {
    return db.select().from(systemAlerts).orderBy(desc(systemAlerts.createdAt));
  }

  async getSystemAlert(id: number): Promise<SystemAlert | undefined> {
    const [alert] = await db.select().from(systemAlerts).where(eq(systemAlerts.id, id));
    return alert;
  }

  async createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert> {
    const [createdAlert] = await db
      .insert(systemAlerts)
      .values(alert)
      .returning();
    return createdAlert;
  }

  async updateSystemAlert(id: number, data: Partial<InsertSystemAlert>): Promise<SystemAlert> {
    const [updatedAlert] = await db
      .update(systemAlerts)
      .set(data)
      .where(eq(systemAlerts.id, id))
      .returning();
    return updatedAlert;
  }

  // ==================== Dashboard Stats ====================
  async getDashboardStats(): Promise<{
    occupied: number;
    available: number;
    pendingReleases: number;
    unclaimed: number;
    recentRegistrations: DeceasedPatient[];
    pendingTasks: Task[];
    alerts: SystemAlert[];
  }> {
    // Get storage statistics
    const occupiedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(storageUnits)
      .where(eq(storageUnits.status, "occupied"));
    
    const availableCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(storageUnits)
      .where(eq(storageUnits.status, "available"));
    
    // Get pending releases count
    const pendingReleasesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(deceasedPatients)
      .where(eq(deceasedPatients.status, "pending_release"));
    
    // Get unclaimed bodies count
    const unclaimedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(deceasedPatients)
      .where(eq(deceasedPatients.status, "unclaimed"));
    
    // Get recent registrations
    const recentRegistrations = await db
      .select()
      .from(deceasedPatients)
      .orderBy(desc(deceasedPatients.registrationDate))
      .limit(5);
    
    // Get pending tasks
    const pendingTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.status, "pending"))
      .orderBy([desc(tasks.priority), asc(tasks.dueDate)])
      .limit(4);
    
    // Get active alerts
    const activeAlerts = await db
      .select()
      .from(systemAlerts)
      .where(
        and(
          eq(systemAlerts.status, "active"),
          or(
            eq(systemAlerts.severity, "critical"),
            eq(systemAlerts.severity, "warning")
          )
        )
      )
      .orderBy([desc(systemAlerts.severity), desc(systemAlerts.createdAt)])
      .limit(3);
    
    return {
      occupied: occupiedCount[0].count,
      available: availableCount[0].count,
      pendingReleases: pendingReleasesCount[0].count,
      unclaimed: unclaimedCount[0].count,
      recentRegistrations,
      pendingTasks,
      alerts: activeAlerts
    };
  }
}

export const storage = new DatabaseStorage();
