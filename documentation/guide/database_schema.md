# Database Schema & Relational Models

Q-RAKSHAK utilizes a relational database architecture managed via **Prisma ORM** (`prisma/schema.prisma`) with SQLite for local execution and PostgreSQL for enterprise clinical deployments.

---

## 1. Entity-Relationship Diagram

```
          
     Users       1      *       Assessments      
 (Patient/Staff)   (ESI Triage & AI)   
          
         1                                  1
                                           
         *                                  *
          
 Consultations                VitalTelemetries   
 &Prescriptions             (Longitudinal Store) 
          
```

---

## 2. Prisma Model Definitions

```prisma
model User {
  id            String          @id @default(uuid())
  email         String          @unique
  name          String
  role          UserRole        @default(PATIENT)
  bloodGroup    String?
  dateOfBirth   DateTime?
  allergies     String[]
  emergencyCard EmergencyCard?
  assessments   Assessment[]
  consultations Consultation[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

enum UserRole {
  PATIENT
  DOCTOR
  RESEARCHER
  ADMIN
}

model Assessment {
  id              String         @id @default(uuid())
  patientId       String
  patient         User           @relation(fields: [patientId], references: [id])
  esiLevel        Int            // 1 to 5
  esiCategory     String
  riskScore       Float
  symptoms        String[]
  modelUsed       String         // e.g. "Sentinel-SVM", "CardioWave-VQC"
  modelConfidence Float
  vitals          VitalRecord?
  createdAt       DateTime       @default(now())

  @@index([patientId, createdAt])
}

model VitalRecord {
  id              String      @id @default(uuid())
  assessmentId    String      @unique
  assessment      Assessment  @relation(fields: [assessmentId], references: [id])
  heartRate       Int
  systolicBp      Int
  diastolicBp     Int
  respiratoryRate Int
  spo2            Float
  temperature     Float
}
```

---

## 3. Indexing & Query Optimization
- Composite index on `[patientId, createdAt]` ensures $O(\log N)$ retrieval for longitudinal timeline graphing.
- Hashed patient identifiers avoid storing plain-text Social Security or Aadhaar numbers.
