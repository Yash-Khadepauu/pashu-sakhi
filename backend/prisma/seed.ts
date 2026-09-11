import { PrismaClient, Role, AnimalGender, HealthStatus, VaccinationStatus, TreatmentStatus, PriorityLevel, ConsultationStatus, ScreeningType, ScreeningStatus, EmergencySeverity, EmergencyStatus, HotspotRiskLevel, HotspotStatus, ComplaintStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PashuSakhi Database Seeding...");

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.screeningLog.deleteMany();
  await prisma.emergency.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.vetProfile.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.outbreakHotspot.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Existing records cleaned.");

  // 2. Hash demo passwords
  const saltRounds = 10;
  const farmerPasswordHash = await bcrypt.hash("farmer123", saltRounds);
  const vetPasswordHash = await bcrypt.hash("vet12345", saltRounds);
  const adminPasswordHash = await bcrypt.hash("admin123", saltRounds);

  // 3. Seed Demo Users
  const farmer = await prisma.user.create({
    data: {
      name: "Suresh Patil",
      email: "farmer@pashusakhi.in",
      mobile: "+91 98765 43210",
      passwordHash: farmerPasswordHash,
      role: Role.farmer,
      villageLocation: "Wagholi, Pune District, Maharashtra",
      preferredLanguage: "mr",
      theme: "system",
      highContrast: false,
    },
  });

  const vet = await prisma.user.create({
    data: {
      name: "Dr. Aditi Kulkarni",
      email: "vet@pashusakhi.in",
      mobile: "+91 98230 12345",
      passwordHash: vetPasswordHash,
      role: Role.veterinarian,
      villageLocation: "Nashik City, Nashik District, Maharashtra",
      preferredLanguage: "en",
      theme: "light",
      highContrast: false,
      vetProfile: {
        create: {
          registrationNumber: "MH-VET-20394",
          qualification: "BVSc & AH, MVSc (Medicine)",
          specialization: "Large Animal Medicine & Surgery",
          clinicAffiliation: "Pashu Sakhi Zonal Health Center, Nashik",
          serviceArea: "Nashik & Igatpuri Taluka",
          experienceYears: 8,
          verifiedLicense: true, // Verified for immediate demo usage
          ratingAvg: 4.95,
          totalCasesHandled: 342,
          unitsAvailable: "1 Mobile Surgical Van, 2 Responders",
        },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@pashusakhi.in",
      mobile: "+91 91111 22222",
      passwordHash: adminPasswordHash,
      role: Role.admin,
      villageLocation: "State Central Command, Mumbai, Maharashtra",
      preferredLanguage: "en",
      theme: "system",
      highContrast: false,
    },
  });

  console.log(`👤 Seeded 3 Demo Users:
  - Farmer: ${farmer.email} (Password: farmer123)
  - Vet: ${vet.email} (Password: vet12345)
  - Admin: ${admin.email} (Password: admin123)`);

  // 4. Seed Animals for Farmer Suresh Patil (Matching Frontend)
  const gauri = await prisma.animal.create({
    data: {
      ownerId: farmer.id,
      earTag: "MH-PUN-0411",
      name: "Gauri",
      species: "Cow",
      breed: "Gir",
      ageYears: 4.0,
      gender: AnimalGender.Female,
      healthStatus: HealthStatus.healthy,
    },
  });

  const raju = await prisma.animal.create({
    data: {
      ownerId: farmer.id,
      earTag: "MH-PUN-0412",
      name: "Raju",
      species: "Buffalo",
      breed: "Murrah",
      ageYears: 6.0,
      gender: AnimalGender.Male,
      healthStatus: HealthStatus.attention,
    },
  });

  const lakshmi = await prisma.animal.create({
    data: {
      ownerId: farmer.id,
      earTag: "MH-PUN-0413",
      name: "Lakshmi",
      species: "Cow",
      breed: "Sahiwal",
      ageYears: 3.0,
      gender: AnimalGender.Female,
      healthStatus: HealthStatus.healthy,
    },
  });

  const moti = await prisma.animal.create({
    data: {
      ownerId: farmer.id,
      earTag: "MH-PUN-0414",
      name: "Moti",
      species: "Cow",
      breed: "Gir",
      ageYears: 5.0,
      gender: AnimalGender.Male,
      healthStatus: HealthStatus.healthy,
    },
  });

  console.log("🐄 Seeded 4 Farmer Animals: Gauri, Raju, Lakshmi, Moti");

  // 5. Seed Vaccinations
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextYear = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000);

  await prisma.vaccination.createMany({
    data: [
      {
        animalId: gauri.id,
        vaccineName: "FMD (Foot & Mouth Disease)",
        dueDate: nextWeek,
        status: VaccinationStatus.due,
        administeredById: vet.id,
      },
      {
        animalId: raju.id,
        vaccineName: "FMD (Foot & Mouth Disease)",
        dueDate: nextMonth,
        status: VaccinationStatus.due,
      },
      {
        animalId: lakshmi.id,
        vaccineName: "Brucellosis",
        dueDate: nextYear,
        status: VaccinationStatus.due,
      },
      {
        animalId: moti.id,
        vaccineName: "HS (Haemorrhagic Septicaemia)",
        dueDate: nextYear,
        status: VaccinationStatus.due,
      },
    ],
  });

  // 6. Seed Treatments
  await prisma.treatment.create({
    data: {
      animalId: raju.id,
      prescribedById: vet.id,
      conditionDiagnosed: "Fever / suspected bacterial infection",
      medicinePrescribed: "Antibiotic course (Enrofloxacin 10%), Multivitamin injection",
      dosage: "15 ml intramuscular",
      route: "IM",
      duration: "3 days",
      clinicalNotes: "Follow-up required if temperature exceeds 103°F. Ensure adequate water intake and rest under shade.",
      startDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      followUpDate: nextWeek,
      status: TreatmentStatus.active,
    },
  });

  // 7. Seed Consultation & Chat Messages
  const consultation = await prisma.consultation.create({
    data: {
      id: "REQ-2041",
      farmerId: farmer.id,
      animalId: gauri.id,
      assignedVetId: vet.id,
      symptomsSummary: "Gauri has slight nasal discharge and mild decrease in milk yield since yesterday morning.",
      priority: PriorityLevel.moderate,
      status: ConsultationStatus.inConsultation,
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        consultationId: consultation.id,
        senderId: farmer.id,
        senderRole: Role.farmer,
        messageText: "Namaste Doctor, Gauri is not eating as much green fodder and milk yield dropped by 1.5 liters.",
        category: "symptoms",
      },
      {
        consultationId: consultation.id,
        senderId: vet.id,
        senderRole: Role.veterinarian,
        messageText: "Namaste Suresh ji. Did you notice any skin nodules or swelling around the neck or hooves?",
        category: "general",
      },
    ],
  });

  // 8. Seed AI Screening Logs
  await prisma.screeningLog.createMany({
    data: [
      {
        id: "AR-3311",
        animalId: raju.id,
        farmerId: farmer.id,
        screeningType: ScreeningType.symptom_triage,
        reportedSymptoms: JSON.stringify(["sym_fever", "sym_lossOfAppetite", "sym_lethargy"]),
        temperatureSelected: "103.2 F",
        appetiteSelected: "Reduced",
        activitySelected: "Sluggish",
        notes: "Buffalo seemed down after evening grazing.",
        aiPredictedCondition: "Acute Bovine Pyrexia / Suspected Infection",
        confidenceScore: 84,
        riskLevel: HealthStatus.attention,
        status: ScreeningStatus.Under_Review,
        reviewedByVetId: vet.id,
        vetReviewNotes: "Prescribed 3-day antibiotic regimen; monitoring closely.",
      },
      {
        id: "AR-3312",
        animalId: lakshmi.id,
        farmerId: farmer.id,
        screeningType: ScreeningType.symptom_triage,
        reportedSymptoms: JSON.stringify([]),
        temperatureSelected: "Normal (101.5 F)",
        appetiteSelected: "Normal",
        activitySelected: "Active",
        notes: "Routine quarterly screening.",
        aiPredictedCondition: "Healthy / Low Risk",
        confidenceScore: 92,
        riskLevel: HealthStatus.healthy,
        status: ScreeningStatus.Resolved,
      },
    ],
  });

  // 9. Seed Emergency
  await prisma.emergency.create({
    data: {
      id: "EMG-0512",
      animalId: raju.id,
      farmerId: farmer.id,
      assignedVetId: vet.id,
      symptoms: "Severe colic, swollen abdomen, and difficulty standing up.",
      aiTriageResult: "High Risk — Acute Ruminal Tympany / Bloat",
      severity: EmergencySeverity.critical,
      status: EmergencyStatus.accepted,
      responseTimeSeconds: 420,
      is1962HelplineInbound: true,
    },
  });

  // 10. Seed Outbreak Hotspots (Matching Frontends: Western Maharashtra districts)
  await prisma.outbreakHotspot.createMany({
    data: [
      {
        id: "HS-01",
        district: "Nashik",
        talukaLocation: "Sinnar & Dodi Taluka",
        diseaseName: "Lumpy Skin Disease (LSD)",
        diseaseCategory: "LSD",
        riskLevel: HotspotRiskLevel.critical,
        status: HotspotStatus.Confirmed,
        latitude: 19.8456,
        longitude: 73.9922,
        mapX: 420,
        mapY: 180,
        radiusKm: 14.5,
        affectedAnimalsCount: 230,
        affectedFarmsCount: 48,
        speciesAffected: "Cattle (Indigenous & Crossbred)",
        recentIncreasePct: "+38%",
        spreadSummary: "Cluster expanding along river basin pastures; vector fly activity high.",
        recommendedAdvisory: "Isolate affected animals immediately; enforce vector control and goat pox ring vaccination within 5 km radius.",
        isNewOutbreak: true,
      },
      {
        id: "HS-02",
        district: "Ahmednagar",
        talukaLocation: "Sangamner & Akole Border",
        diseaseName: "Foot & Mouth Disease (FMD)",
        diseaseCategory: "FMD",
        riskLevel: HotspotRiskLevel.high,
        status: HotspotStatus.Active,
        latitude: 19.5772,
        longitude: 74.2094,
        mapX: 490,
        mapY: 260,
        radiusKm: 11.0,
        affectedAnimalsCount: 142,
        affectedFarmsCount: 31,
        speciesAffected: "Cattle & Buffaloes",
        recentIncreasePct: "+15%",
        spreadSummary: "Secondary spread recorded from weekly livestock market.",
        recommendedAdvisory: "Restrict inter-village animal transport. Apply sodium carbonate footbaths at farm entrances.",
      },
      {
        id: "HS-03",
        district: "Pune",
        talukaLocation: "Shirur & Khed Taluka",
        diseaseName: "Haemorrhagic Septicaemia (HS)",
        diseaseCategory: "HS",
        riskLevel: HotspotRiskLevel.medium,
        status: HotspotStatus.Active,
        latitude: 18.8286,
        longitude: 74.3752,
        mapX: 460,
        mapY: 340,
        radiusKm: 8.5,
        affectedAnimalsCount: 65,
        affectedFarmsCount: 14,
        speciesAffected: "Buffaloes & Cattle",
        recentIncreasePct: "+5%",
        spreadSummary: "Sporadic cases following heavy monsoon drainage stagnation.",
        recommendedAdvisory: "Prophylactic antibiotic therapy and booster HS vaccination for unimmunized herds.",
      },
    ],
  });

  // 11. Seed Complaints
  await prisma.complaint.createMany({
    data: [
      {
        id: "CP-074",
        submittedById: farmer.id,
        category: "Vet Response Delay",
        status: ComplaintStatus.New,
        description: "Emergency request took over 35 minutes for initial phone response in Wagholi area.",
      },
      {
        id: "CP-075",
        submittedById: farmer.id,
        category: "App Issues",
        status: ComplaintStatus.Under_Review,
        assignedToId: admin.id,
        description: "Photo upload for skin lesion screening timed out twice during cloudy weather.",
        resolutionNotes: "CDN compression optimization scheduled.",
      },
    ],
  });

  // 12. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientId: farmer.id,
        recipientRole: Role.farmer,
        category: "vaccination",
        animalId: gauri.id,
        title: "Vaccination Due for Gauri",
        message: "FMD vaccination is scheduled within the next 7 days. Contact your local Pashu Sakhi or vet clinic.",
        read: false,
      },
      {
        recipientId: farmer.id,
        recipientRole: Role.farmer,
        category: "treatment",
        animalId: raju.id,
        title: "Raju's Treatment Follow-Up",
        message: "Dr. Aditi Kulkarni scheduled follow-up on your buffalo Raju's antibiotic course.",
        read: false,
      },
      {
        recipientId: vet.id,
        recipientRole: Role.veterinarian,
        category: "emergency",
        title: "1962 Inbound Emergency Case",
        message: "Critical emergency EMG-0512 dispatched for Murrah Buffalo in Wagholi.",
        read: false,
      },
    ],
  });

  console.log("🔔 Seeded initial notifications and complaints.");
  console.log("✅ PashuSakhi Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
