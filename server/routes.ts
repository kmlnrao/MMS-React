import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole } from "./auth";
import { z } from "zod";
import { 
  insertDeceasedPatientSchema, 
  insertStorageUnitSchema, 
  insertStorageAssignmentSchema, 
  insertPostmortemSchema, 
  insertBodyReleaseRequestSchema,
  insertTaskSchema,
  insertSystemAlertSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // ============= Deceased Patients API =============
  app.get("/api/patients", isAuthenticated, async (req, res, next) => {
    try {
      const patients = await storage.getAllDeceasedPatients();
      res.json(patients);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/patients/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getDeceasedPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/patients", isAuthenticated, async (req, res, next) => {
    try {
      const validation = insertDeceasedPatientSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const patient = await storage.createDeceasedPatient({
        ...validation.data,
        registeredById: req.user!.id
      });
      
      res.status(201).json(patient);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/patients/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existingPatient = await storage.getDeceasedPatient(id);
      
      if (!existingPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      const updateSchema = insertDeceasedPatientSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const updatedPatient = await storage.updateDeceasedPatient(id, validation.data);
      res.json(updatedPatient);
    } catch (error) {
      next(error);
    }
  });

  // ============= Storage Units API =============
  app.get("/api/storage-units", isAuthenticated, async (req, res, next) => {
    try {
      const storageUnits = await storage.getAllStorageUnits();
      res.json(storageUnits);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/storage-units/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const unit = await storage.getStorageUnit(id);
      
      if (!unit) {
        return res.status(404).json({ message: "Storage unit not found" });
      }
      
      res.json(unit);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/storage-units", hasRole(["admin", "mortuary_staff"]), async (req, res, next) => {
    try {
      const validation = insertStorageUnitSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const unit = await storage.createStorageUnit(validation.data);
      res.status(201).json(unit);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/storage-units/:id", hasRole(["admin", "mortuary_staff"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existingUnit = await storage.getStorageUnit(id);
      
      if (!existingUnit) {
        return res.status(404).json({ message: "Storage unit not found" });
      }
      
      const updateSchema = insertStorageUnitSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const updatedUnit = await storage.updateStorageUnit(id, validation.data);
      res.json(updatedUnit);
    } catch (error) {
      next(error);
    }
  });

  // ============= Storage Assignments API =============
  app.get("/api/storage-assignments", isAuthenticated, async (req, res, next) => {
    try {
      const assignments = await storage.getAllStorageAssignments();
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/storage-assignments", hasRole(["admin", "mortuary_staff"]), async (req, res, next) => {
    try {
      const validation = insertStorageAssignmentSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const assignment = await storage.createStorageAssignment({
        ...validation.data,
        assignedById: req.user!.id,
        status: "active"
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/storage-assignments/:id", hasRole(["admin", "mortuary_staff"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existingAssignment = await storage.getStorageAssignment(id);
      
      if (!existingAssignment) {
        return res.status(404).json({ message: "Storage assignment not found" });
      }
      
      const updateSchema = insertStorageAssignmentSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const updatedAssignment = await storage.updateStorageAssignment(id, validation.data);
      res.json(updatedAssignment);
    } catch (error) {
      next(error);
    }
  });

  // ============= Postmortems API =============
  app.get("/api/postmortems", isAuthenticated, async (req, res, next) => {
    try {
      const postmortems = await storage.getAllPostmortems();
      res.json(postmortems);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/postmortems/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const postmortem = await storage.getPostmortem(id);
      
      if (!postmortem) {
        return res.status(404).json({ message: "Postmortem not found" });
      }
      
      res.json(postmortem);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/postmortems", hasRole(["admin", "medical_staff"]), async (req, res, next) => {
    try {
      const validation = insertPostmortemSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const postmortem = await storage.createPostmortem(validation.data);
      res.status(201).json(postmortem);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/postmortems/:id", hasRole(["admin", "medical_staff"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existingPostmortem = await storage.getPostmortem(id);
      
      if (!existingPostmortem) {
        return res.status(404).json({ message: "Postmortem not found" });
      }
      
      const updateSchema = insertPostmortemSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const updatedPostmortem = await storage.updatePostmortem(id, validation.data);
      
      // If postmortem is completed, update patient status
      if (validation.data.status === "completed" && existingPostmortem.status !== "completed") {
        await storage.updateDeceasedPatient(existingPostmortem.deceasedId, {
          status: "autopsy_completed"
        });
      }
      
      res.json(updatedPostmortem);
    } catch (error) {
      next(error);
    }
  });

  // ============= Body Release API =============
  app.get("/api/releases", isAuthenticated, async (req, res, next) => {
    try {
      const releases = await storage.getAllBodyReleaseRequests();
      res.json(releases);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/releases/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const release = await storage.getBodyReleaseRequest(id);
      
      if (!release) {
        return res.status(404).json({ message: "Release request not found" });
      }
      
      res.json(release);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/releases", isAuthenticated, async (req, res, next) => {
    try {
      const validation = insertBodyReleaseRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const release = await storage.createBodyReleaseRequest({
        ...validation.data,
        requestedById: req.user!.id,
        approvalStatus: "pending"
      });
      
      // Update patient status
      await storage.updateDeceasedPatient(validation.data.deceasedId, {
        status: "pending_release"
      });
      
      res.status(201).json(release);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/releases/:id", hasRole(["admin", "medical_staff", "mortuary_staff"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existingRelease = await storage.getBodyReleaseRequest(id);
      
      if (!existingRelease) {
        return res.status(404).json({ message: "Release request not found" });
      }
      
      const updateSchema = insertBodyReleaseRequestSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      // If approving the release
      if (validation.data.approvalStatus === "approved" && existingRelease.approvalStatus !== "approved") {
        validation.data.approvedById = req.user!.id;
        validation.data.approvalDate = new Date();
        
        // Update patient status
        await storage.updateDeceasedPatient(existingRelease.deceasedId, {
          status: "released"
        });
        
        // Mark storage assignment as released
        const assignment = await storage.getStorageAssignmentByDeceasedId(existingRelease.deceasedId);
        if (assignment) {
          await storage.updateStorageAssignment(assignment.id, {
            status: "released",
            releaseDate: new Date()
          });
          
          // Update storage unit status to available
          await storage.updateStorageUnit(assignment.storageUnitId, {
            status: "available"
          });
        }
      }
      
      const updatedRelease = await storage.updateBodyReleaseRequest(id, validation.data);
      res.json(updatedRelease);
    } catch (error) {
      next(error);
    }
  });

  // ============= Tasks API =============
  app.get("/api/tasks", isAuthenticated, async (req, res, next) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res, next) => {
    try {
      const validation = insertTaskSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const task = await storage.createTask(validation.data);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existingTask = await storage.getTask(id);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updateSchema = insertTaskSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      // If completing the task
      if (validation.data.status === "completed" && existingTask.status !== "completed") {
        validation.data.completedAt = new Date();
      }
      
      const updatedTask = await storage.updateTask(id, validation.data);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  // ============= System Alerts API =============
  app.get("/api/alerts", isAuthenticated, async (req, res, next) => {
    try {
      const alerts = await storage.getAllSystemAlerts();
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/alerts", hasRole(["admin", "mortuary_staff"]), async (req, res, next) => {
    try {
      const validation = insertSystemAlertSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      const alert = await storage.createSystemAlert(validation.data);
      res.status(201).json(alert);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/alerts/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existingAlert = await storage.getSystemAlert(id);
      
      if (!existingAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      const updateSchema = insertSystemAlertSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      // Handle status changes
      if (validation.data.status === "acknowledged" && existingAlert.status === "active") {
        validation.data.acknowledgedById = req.user!.id;
        validation.data.acknowledgedAt = new Date();
      } else if (validation.data.status === "resolved" && existingAlert.status !== "resolved") {
        validation.data.resolvedById = req.user!.id;
        validation.data.resolvedAt = new Date();
      }
      
      const updatedAlert = await storage.updateSystemAlert(id, validation.data);
      res.json(updatedAlert);
    } catch (error) {
      next(error);
    }
  });

  // ============= Dashboard API =============
  app.get("/api/dashboard", isAuthenticated, async (req, res, next) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // ============= User Management API (Admin Only) =============
  app.get("/api/users", hasRole(["admin"]), async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove password from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", hasRole(["admin"]), async (req, res, next) => {
    try {
      const createUserSchema = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        fullName: z.string(),
        email: z.string().email(),
        role: z.enum(["admin", "medical_staff", "mortuary_staff"])
      });
      
      const validation = createUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validation.data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validation.data);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id", hasRole(["admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const existingUser = await storage.getUser(id);
      
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updateUserSchema = z.object({
        username: z.string().min(3).optional(),
        password: z.string().min(6).optional(),
        fullName: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "medical_staff", "mortuary_staff"]).optional()
      });
      
      const validation = updateUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }
      
      // Check if username already exists (if changing username)
      if (validation.data.username && validation.data.username !== existingUser.username) {
        const existingUserWithUsername = await storage.getUserByUsername(validation.data.username);
        if (existingUserWithUsername) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(id, validation.data);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", hasRole(["admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Don't allow deleting your own account
      if (id === req.user!.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      const existingUser = await storage.getUser(id);
      
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
