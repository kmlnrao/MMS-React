import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  users, 
  deceasedPatients, 
  storageUnits, 
  storageAssignments,
  postmortems,
  bodyReleaseRequests,
  tasks,
  systemAlerts
} from './shared/schema';
import { eq, and, sql } from 'drizzle-orm';

async function main() {
  // Make sure DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Get existing user IDs
  const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
  const doctorUser = await db.select().from(users).where(eq(users.username, 'doctor')).limit(1);
  const mortuaryUser = await db.select().from(users).where(eq(users.username, 'mortuary')).limit(1);
  
  if (adminUser.length === 0 || doctorUser.length === 0 || mortuaryUser.length === 0) {
    console.error('Demo users not found. Please run setup-db.ts first.');
    process.exit(1);
  }

  const adminId = adminUser[0].id;
  const doctorId = doctorUser[0].id;
  const mortuaryId = mortuaryUser[0].id;

  // Create storage units
  console.log('Creating storage units...');
  await db.execute('TRUNCATE TABLE storage_units CASCADE');
  
  const storageUnitData = [
    { unitNumber: 'A-01', section: 'A', temperature: -5, status: 'available', lastMaintenance: new Date('2023-12-15'), notes: 'Recently serviced' },
    { unitNumber: 'A-02', section: 'A', temperature: -5, status: 'available', lastMaintenance: new Date('2023-12-15'), notes: null },
    { unitNumber: 'A-03', section: 'A', temperature: -5, status: 'available', lastMaintenance: new Date('2023-12-15'), notes: null },
    { unitNumber: 'A-04', section: 'A', temperature: -5, status: 'maintenance', lastMaintenance: new Date('2023-12-15'), notes: 'Temperature fluctuation issue' },
    { unitNumber: 'B-01', section: 'B', temperature: -4, status: 'available', lastMaintenance: new Date('2023-11-20'), notes: null },
    { unitNumber: 'B-02', section: 'B', temperature: -4, status: 'available', lastMaintenance: new Date('2023-11-20'), notes: null },
    { unitNumber: 'B-03', section: 'B', temperature: -4, status: 'available', lastMaintenance: new Date('2023-11-20'), notes: null },
    { unitNumber: 'B-04', section: 'B', temperature: -4, status: 'available', lastMaintenance: new Date('2023-11-20'), notes: null },
    { unitNumber: 'C-01', section: 'C', temperature: -6, status: 'available', lastMaintenance: new Date('2023-10-05'), notes: null },
    { unitNumber: 'C-02', section: 'C', temperature: -6, status: 'available', lastMaintenance: new Date('2023-10-05'), notes: null },
    { unitNumber: 'C-03', section: 'C', temperature: -6, status: 'available', lastMaintenance: new Date('2023-10-05'), notes: null },
    { unitNumber: 'C-04', section: 'C', temperature: -6, status: 'available', lastMaintenance: new Date('2023-10-05'), notes: null },
  ];
  
  for (const unit of storageUnitData) {
    await db.insert(storageUnits).values(unit);
  }
  console.log(`Created ${storageUnitData.length} storage units`);

  // Create deceased patients
  console.log('Creating deceased patients...');
  await db.execute('TRUNCATE TABLE deceased_patients CASCADE');
  
  const patientData = [
    { 
      mrNumber: 'MR123456', 
      fullName: 'John Doe', 
      age: 67, 
      gender: 'male', 
      dateOfDeath: new Date('2023-03-15T13:45:00'), 
      causeOfDeath: 'Cardiac Arrest', 
      wardFrom: 'ICU', 
      attendingPhysician: 'Dr. Sarah Johnson',
      registrationDate: new Date('2023-03-15T14:30:00'),
      registeredById: doctorId,
      notes: null,
      status: 'in_storage',
      documents: null
    },
    { 
      mrNumber: 'MR789012', 
      fullName: 'Jane Smith', 
      age: 82, 
      gender: 'female', 
      dateOfDeath: new Date('2023-03-14T22:15:00'), 
      causeOfDeath: 'Respiratory Failure', 
      wardFrom: 'Pulmonology', 
      attendingPhysician: 'Dr. Michael Chen',
      registrationDate: new Date('2023-03-15T08:10:00'),
      registeredById: doctorId,
      notes: 'Patient was in palliative care',
      status: 'in_storage',
      documents: null
    },
    { 
      mrNumber: 'MR345678', 
      fullName: 'Robert Johnson', 
      age: 45, 
      gender: 'male', 
      dateOfDeath: new Date('2023-03-16T05:20:00'), 
      causeOfDeath: 'Traumatic Brain Injury', 
      wardFrom: 'Emergency', 
      attendingPhysician: 'Dr. Patricia Rodriguez',
      registrationDate: new Date('2023-03-16T07:30:00'),
      registeredById: doctorId,
      notes: 'MVA victim, police case',
      status: 'postmortem_pending',
      documents: null
    },
    { 
      mrNumber: 'MR901234', 
      fullName: 'Maria Garcia', 
      age: 73, 
      gender: 'female', 
      dateOfDeath: new Date('2023-03-13T18:05:00'), 
      causeOfDeath: 'Cancer', 
      wardFrom: 'Oncology', 
      attendingPhysician: 'Dr. James Wilson',
      registrationDate: new Date('2023-03-14T09:15:00'),
      registeredById: doctorId,
      notes: null,
      status: 'released',
      documents: null
    },
    { 
      mrNumber: 'MR567890', 
      fullName: 'David Lee', 
      age: 59, 
      gender: 'male', 
      dateOfDeath: new Date('2023-03-17T10:45:00'), 
      causeOfDeath: 'Stroke', 
      wardFrom: 'Neurology', 
      attendingPhysician: 'Dr. Sarah Johnson',
      registrationDate: new Date('2023-03-17T12:20:00'),
      registeredById: doctorId,
      notes: null,
      status: 'in_storage',
      documents: null
    },
    { 
      mrNumber: 'MR234567', 
      fullName: 'Sarah Williams', 
      age: 36, 
      gender: 'female', 
      dateOfDeath: new Date('2023-03-18T02:30:00'), 
      causeOfDeath: 'Unknown', 
      wardFrom: 'Emergency', 
      attendingPhysician: 'Dr. Thomas Brown',
      registrationDate: new Date('2023-03-18T05:10:00'),
      registeredById: doctorId,
      notes: 'Forensic case',
      status: 'postmortem_pending',
      documents: null
    },
    { 
      mrNumber: 'MR678901', 
      fullName: 'James Wilson', 
      age: 91, 
      gender: 'male', 
      dateOfDeath: new Date('2023-03-12T21:05:00'), 
      causeOfDeath: 'Natural Causes', 
      wardFrom: 'Geriatrics', 
      attendingPhysician: 'Dr. Elizabeth Taylor',
      registrationDate: new Date('2023-03-13T08:30:00'),
      registeredById: doctorId,
      notes: null,
      status: 'release_pending',
      documents: null
    },
    { 
      mrNumber: 'MR890123', 
      fullName: 'Emily Davis', 
      age: 29, 
      gender: 'female', 
      dateOfDeath: new Date('2023-03-11T15:45:00'), 
      causeOfDeath: 'Septic Shock', 
      wardFrom: 'ICU', 
      attendingPhysician: 'Dr. Richard White',
      registrationDate: new Date('2023-03-11T17:20:00'),
      registeredById: doctorId,
      notes: null,
      status: 'released',
      documents: null
    },
    { 
      mrNumber: 'MR456789', 
      fullName: 'Michael Brown', 
      age: 62, 
      gender: 'male', 
      dateOfDeath: new Date('2023-03-17T13:35:00'), 
      causeOfDeath: 'Heart Failure', 
      wardFrom: 'Cardiology', 
      attendingPhysician: 'Dr. Jennifer Kim',
      registrationDate: new Date('2023-03-17T15:00:00'),
      registeredById: doctorId,
      notes: null,
      status: 'in_storage',
      documents: null
    },
    { 
      mrNumber: 'MR012345', 
      fullName: 'Lisa Chen', 
      age: 55, 
      gender: 'female', 
      dateOfDeath: new Date('2023-03-16T11:15:00'), 
      causeOfDeath: 'Liver Failure', 
      wardFrom: 'Gastroenterology', 
      attendingPhysician: 'Dr. Robert Martinez',
      registrationDate: new Date('2023-03-16T12:40:00'),
      registeredById: doctorId,
      notes: null,
      status: 'unclaimed',
      documents: null
    }
  ];
  
  const insertedPatients = [];
  for (const patient of patientData) {
    const result = await db.insert(deceasedPatients).values(patient).returning();
    insertedPatients.push(result[0]);
  }
  console.log(`Created ${patientData.length} deceased patients`);

  // Create storage assignments
  console.log('Creating storage assignments...');
  await db.execute('TRUNCATE TABLE storage_assignments CASCADE');
  
  const getStorageUnit = async (id: number) => {
    const [unit] = await db.select().from(storageUnits).where(eq(storageUnits.id, id));
    return unit;
  };
  
  // Assign some patients to storage units
  const storagePatients = insertedPatients.filter(p => 
    p.status === 'in_storage' || p.status === 'postmortem_pending' || p.status === 'release_pending' || p.status === 'unclaimed'
  );
  
  for (let i = 0; i < storagePatients.length; i++) {
    const patient = storagePatients[i];
    const unitId = i + 1; // Simple assignment to units 1-7
    
    // Update unit status
    await db.update(storageUnits)
      .set({ status: 'occupied' })
      .where(eq(storageUnits.id, unitId));
    
    await db.insert(storageAssignments).values({
      deceasedId: patient.id,
      storageUnitId: unitId,
      assignedAt: new Date(patient.registrationDate.getTime() + 1000 * 60 * 30), // 30 minutes after registration
      assignedById: mortuaryId,
      releaseDate: patient.status === 'released' ? new Date() : null,
      status: patient.status === 'released' ? 'released' : 'active'
    });
  }
  console.log(`Created ${storagePatients.length} storage assignments`);

  // Create postmortems
  console.log('Creating postmortems...');
  await db.execute('TRUNCATE TABLE postmortems CASCADE');
  
  const postmortemPatients = insertedPatients.filter(p => p.status === 'postmortem_pending');
  
  for (const patient of postmortemPatients) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await db.insert(postmortems).values({
      deceasedId: patient.id,
      scheduledDate: tomorrow,
      completedDate: null,
      assignedToId: doctorId,
      findings: null,
      images: null,
      status: 'scheduled',
      isForensic: patient.notes?.includes('forensic') || patient.notes?.includes('police') ? true : false,
      notes: null
    });
  }
  console.log(`Created ${postmortemPatients.length} postmortems`);

  // Create body release requests
  console.log('Creating body release requests...');
  await db.execute('TRUNCATE TABLE body_release_requests CASCADE');
  
  const releasePendingPatients = insertedPatients.filter(p => p.status === 'release_pending');
  const releasedPatients = insertedPatients.filter(p => p.status === 'released');
  
  for (const patient of [...releasePendingPatients, ...releasedPatients]) {
    const requestDate = new Date(patient.registrationDate.getTime() + 1000 * 60 * 60 * 24); // 1 day after registration
    const isReleased = patient.status === 'released';
    
    await db.insert(bodyReleaseRequests).values({
      deceasedId: patient.id,
      requestDate,
      requestedById: mortuaryId,
      nextOfKinName: `Family member of ${patient.fullName}`,
      nextOfKinRelation: 'Son',
      nextOfKinContact: '555-123-4567',
      identityVerified: true,
      approvalStatus: isReleased ? 'approved' : 'pending',
      approvedById: isReleased ? adminId : null,
      approvalDate: isReleased ? new Date(requestDate.getTime() + 1000 * 60 * 60 * 2) : null, // 2 hours after request
      releaseDate: isReleased ? new Date(requestDate.getTime() + 1000 * 60 * 60 * 4) : null, // 4 hours after request
      transferredTo: isReleased ? 'Family' : null,
      documents: null,
      notes: null
    });
  }
  console.log(`Created ${releasePendingPatients.length + releasedPatients.length} body release requests`);

  // Create tasks
  console.log('Creating tasks...');
  await db.execute('TRUNCATE TABLE tasks CASCADE');
  
  const taskData = [
    {
      title: 'Complete postmortem for Robert Johnson',
      description: 'Scheduled postmortem for MVA victim',
      assignedToId: doctorId,
      priority: 'high',
      status: 'pending',
      dueDate: new Date(new Date().getTime() + 1000 * 60 * 60 * 24), // Tomorrow
      createdAt: new Date(),
      completedAt: null,
      notes: null,
      relatedEntityType: 'deceased_patient',
      relatedEntityId: insertedPatients.find(p => p.fullName === 'Robert Johnson')?.id
    },
    {
      title: 'Contact authorities about unclaimed body',
      description: 'Lisa Chen has been unclaimed for more than 48 hours',
      assignedToId: mortuaryId,
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(new Date().getTime() + 1000 * 60 * 60 * 48), // 2 days from now
      createdAt: new Date(),
      completedAt: null,
      notes: null,
      relatedEntityType: 'deceased_patient',
      relatedEntityId: insertedPatients.find(p => p.fullName === 'Lisa Chen')?.id
    },
    {
      title: 'Schedule maintenance for unit A-04',
      description: 'Temperature fluctuation issue needs to be addressed',
      assignedToId: mortuaryId,
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(new Date().getTime() + 1000 * 60 * 60 * 72), // 3 days from now
      createdAt: new Date(),
      completedAt: null,
      notes: null,
      relatedEntityType: 'storage_unit',
      relatedEntityId: 4 // A-04 unit
    },
    {
      title: 'Process release approval for James Wilson',
      description: 'Family has submitted all required documents',
      assignedToId: adminId,
      priority: 'high',
      status: 'pending',
      dueDate: new Date(new Date().getTime() + 1000 * 60 * 60 * 12), // 12 hours from now
      createdAt: new Date(),
      completedAt: null,
      notes: null,
      relatedEntityType: 'body_release',
      relatedEntityId: insertedPatients.find(p => p.fullName === 'James Wilson')?.id
    },
    {
      title: 'Update monthly mortuary statistics',
      description: 'Prepare the monthly report for hospital administration',
      assignedToId: adminId,
      priority: 'low',
      status: 'pending',
      dueDate: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
      createdAt: new Date(),
      completedAt: null,
      notes: null,
      relatedEntityType: null,
      relatedEntityId: null
    }
  ];
  
  for (const task of taskData) {
    await db.insert(tasks).values(task);
  }
  console.log(`Created ${taskData.length} tasks`);

  // Create system alerts
  console.log('Creating system alerts...');
  await db.execute('TRUNCATE TABLE system_alerts CASCADE');
  
  const alertData = [
    {
      type: 'maintenance',
      title: 'Storage Unit Maintenance Required',
      message: 'Unit A-04 is showing temperature fluctuations and requires maintenance',
      severity: 'warning',
      status: 'active',
      createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 12), // 12 hours ago
      acknowledgedById: null,
      acknowledgedAt: null,
      resolvedById: null,
      resolvedAt: null,
      relatedEntityType: 'storage_unit',
      relatedEntityId: 4 // A-04 unit
    },
    {
      type: 'capacity',
      title: 'Storage Capacity Warning',
      message: 'Mortuary storage is approaching 70% capacity',
      severity: 'info',
      status: 'active',
      createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24), // 1 day ago
      acknowledgedById: mortuaryId,
      acknowledgedAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 23), // 23 hours ago
      resolvedById: null,
      resolvedAt: null,
      relatedEntityType: null,
      relatedEntityId: null
    },
    {
      type: 'postmortem',
      title: 'Forensic Case Notification',
      message: 'A new forensic case has been registered and requires police notification',
      severity: 'critical',
      status: 'active',
      createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 6), // 6 hours ago
      acknowledgedById: doctorId,
      acknowledgedAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
      resolvedById: null,
      resolvedAt: null,
      relatedEntityType: 'deceased_patient',
      relatedEntityId: insertedPatients.find(p => p.fullName === 'Sarah Williams')?.id
    },
    {
      type: 'unclaimed',
      title: 'Unclaimed Body Alert',
      message: 'Patient Lisa Chen has been unclaimed for 48+ hours',
      severity: 'warning',
      status: 'active',
      createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
      acknowledgedById: null,
      acknowledgedAt: null,
      resolvedById: null,
      resolvedAt: null,
      relatedEntityType: 'deceased_patient',
      relatedEntityId: insertedPatients.find(p => p.fullName === 'Lisa Chen')?.id
    }
  ];
  
  for (const alert of alertData) {
    await db.insert(systemAlerts).values(alert);
  }
  console.log(`Created ${alertData.length} system alerts`);

  console.log('\nDemo data setup complete!');
}

main().catch(err => {
  console.error('Error setting up demo data:', err);
  process.exit(1);
});