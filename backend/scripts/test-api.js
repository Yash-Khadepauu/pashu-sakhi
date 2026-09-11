const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("🧪 Starting Comprehensive Backend API Test Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health Check
  console.log("1. Testing GET /api/health");
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthJson = await healthRes.json();
  assert(healthRes.status === 200, "Health endpoint returns HTTP 200");
  assert(healthJson.success === true, "Health response success is true");
  assert(healthJson.data.database === "connected", "Database status is connected");

  // 2. Farmer Login
  console.log("\n2. Testing POST /api/v1/auth/login (Farmer)");
  const farmerLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "farmer@pashusakhi.in", password: "farmer123" }),
  });
  const farmerLogin = await farmerLoginRes.json();
  assert(farmerLoginRes.status === 200, "Farmer login returns HTTP 200");
  assert(Boolean(farmerLogin.data?.token), "Farmer received valid JWT token");
  assert(farmerLogin.data?.user?.role === "farmer", "Farmer user role is farmer");
  const farmerToken = farmerLogin.data?.token;

  // 3. Vet Login
  console.log("\n3. Testing POST /api/v1/auth/login (Vet)");
  const vetLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vet@pashusakhi.in", password: "vet12345" }),
  });
  const vetLogin = await vetLoginRes.json();
  assert(vetLoginRes.status === 200, "Vet login returns HTTP 200");
  assert(Boolean(vetLogin.data?.token), "Vet received valid JWT token");
  assert(vetLogin.data?.user?.role === "veterinarian", "Vet user role is veterinarian");
  const vetToken = vetLogin.data?.token;

  // 4. Admin Login
  console.log("\n4. Testing POST /api/v1/auth/login (Admin)");
  const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@pashusakhi.in", password: "admin123" }),
  });
  const adminLogin = await adminLoginRes.json();
  assert(adminLoginRes.status === 200, "Admin login returns HTTP 200");
  assert(Boolean(adminLogin.data?.token), "Admin received valid JWT token");
  assert(adminLogin.data?.user?.role === "admin", "Admin user role is admin");
  const adminToken = adminLogin.data?.token;

  // 5. Auth /me endpoint
  console.log("\n5. Testing GET /api/v1/auth/me");
  const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const meJson = await meRes.json();
  assert(meRes.status === 200, "GET /auth/me returns HTTP 200");
  assert(meJson.data?.user?.email === "farmer@pashusakhi.in", "Verified authenticated user is Suresh Patil");

  // 6. User Profile
  console.log("\n6. Testing GET & PUT /api/v1/users/profile");
  const profileRes = await fetch(`${BASE_URL}/api/v1/users/profile`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  assert(profileRes.status === 200, "GET /users/profile returns HTTP 200");

  const updateProfileRes = await fetch(`${BASE_URL}/api/v1/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${farmerToken}`,
    },
    body: JSON.stringify({ preferredLanguage: "varhadi" }),
  });
  const updateProfileJson = await updateProfileRes.json();
  assert(updateProfileRes.status === 200, "PUT /users/profile returns HTTP 200");
  assert(updateProfileJson.data?.profile?.preferredLanguage === "varhadi", "Language updated to varhadi");

  // 7. Animals: List Animals for Farmer
  console.log("\n7. Testing GET /api/v1/animals (Farmer)");
  const animalsRes = await fetch(`${BASE_URL}/api/v1/animals`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const animalsJson = await animalsRes.json();
  assert(animalsRes.status === 200, "GET /animals returns HTTP 200");
  assert(animalsJson.data?.animals?.length >= 4, "Farmer has 4 seeded animals");
  const gauriId = animalsJson.data?.animals?.find((a) => a.name === "Gauri")?.id;

  // 8. Farmer Creates Animal
  console.log("\n8. Testing POST /api/v1/animals (Farmer creates new livestock)");
  const createAnimalRes = await fetch(`${BASE_URL}/api/v1/animals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${farmerToken}`,
    },
    body: JSON.stringify({
      name: "Sundari",
      species: "Cow",
      breed: "Sahiwal",
      ageYears: 2.5,
      gender: "Female",
      vaccinationName: "FMD Booster",
    }),
  });
  const createAnimalJson = await createAnimalRes.json();
  assert(createAnimalRes.status === 201, "Farmer created animal successfully (HTTP 201)");
  assert(createAnimalJson.data?.animal?.name === "Sundari", "Created animal name is Sundari");
  const sundariId = createAnimalJson.data?.animal?.id;

  // 9. Animal History
  console.log("\n9. Testing GET /api/v1/animals/:id/history");
  const historyRes = await fetch(`${BASE_URL}/api/v1/animals/${gauriId}/history`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const historyJson = await historyRes.json();
  assert(historyRes.status === 200, "GET /animals/:id/history returns HTTP 200");
  assert(Array.isArray(historyJson.data?.history), "History is an array");

  // 10. Ownership Check: Register second farmer and ensure Farmer B cannot access Farmer A's animal
  console.log("\n10. Testing Ownership Isolation (Farmer B cannot access Farmer A's animal)");
  const farmer2RegRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ramesh Shinde",
      email: "ramesh@pashusakhi.in",
      password: "ramesh123password",
      role: "farmer",
    }),
  });
  const farmer2 = await farmer2RegRes.json();
  const farmer2Token = farmer2.data?.token;

  const unauthorizedAnimalRes = await fetch(`${BASE_URL}/api/v1/animals/${sundariId}`, {
    headers: { Authorization: `Bearer ${farmer2Token}` },
  });
  assert(unauthorizedAnimalRes.status === 403, "Farmer B blocked with HTTP 403 Forbidden");

  // 11. Consultation: Vet Access & Status Update
  console.log("\n11. Testing Consultations (Vet access and triage)");
  const consultListRes = await fetch(`${BASE_URL}/api/v1/consultations`, {
    headers: { Authorization: `Bearer ${vetToken}` },
  });
  const consultList = await consultListRes.json();
  assert(consultListRes.status === 200, "Vet can list consultations (HTTP 200)");
  const consultId = consultList.data?.consultations?.[0]?.id;

  if (consultId) {
    const updateConsultRes = await fetch(`${BASE_URL}/api/v1/consultations/${consultId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vetToken}`,
      },
      body: JSON.stringify({ status: "inConsultation" }),
    });
    assert(updateConsultRes.status === 200, "Vet can transition consultation status to inConsultation");
  }

  // 12. Clinical Treatment Creation (Vet Only)
  console.log("\n12. Testing POST /api/v1/treatments (Vet creates clinical prescription)");
  const treatmentRes = await fetch(`${BASE_URL}/api/v1/treatments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vetToken}`,
    },
    body: JSON.stringify({
      animalId: gauriId,
      conditionDiagnosed: "Mild Ruminal Indigestion",
      medicinePrescribed: "Digestive bolus & electrolyte powder",
      dosage: "2 bolus twice daily",
      duration: "3 days",
    }),
  });
  const treatmentJson = await treatmentRes.json();
  assert(treatmentRes.status === 201, "Vet created clinical treatment record (HTTP 201)");
  assert(treatmentJson.data?.treatment?.conditionDiagnosed === "Mild Ruminal Indigestion", "Treatment recorded condition accurately");

  // Test that Farmer CANNOT create treatments
  const farmerTreatmentRes = await fetch(`${BASE_URL}/api/v1/treatments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${farmerToken}`,
    },
    body: JSON.stringify({
      animalId: gauriId,
      conditionDiagnosed: "Unauthorized Rx",
    }),
  });
  assert(farmerTreatmentRes.status === 403, "Farmer is rejected from creating treatments (HTTP 403 Forbidden)");

  // 13. AI Diagnostic Rule-Based Screening
  console.log("\n13. Testing POST /api/v1/diagnostics/symptoms (Rule-based classifier)");
  const diagRes = await fetch(`${BASE_URL}/api/v1/diagnostics/symptoms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${farmerToken}`,
    },
    body: JSON.stringify({
      animalId: gauriId,
      reportedSymptoms: ["sym_fever", "sym_nasaldischarge"],
      temperatureSelected: "103.5 F",
      appetiteSelected: "Reduced",
    }),
  });
  const diagJson = await diagRes.json();
  assert(diagRes.status === 201, "Diagnostic screening evaluated (HTTP 201)");
  assert(diagJson.data?.log?.riskLevel === "attention", "Risk level classified as attention");
  assert(Boolean(diagJson.data?.log?.aiPredictedCondition), `Predicted condition: ${diagJson.data?.log?.aiPredictedCondition}`);
  assert(diagJson.data?.recommendations?.length > 0, "Returned actionable recommendations");

  // 14. Emergency SOS & Vet Acceptance
  console.log("\n14. Testing Emergencies (Creation & Acceptance)");
  const emgRes = await fetch(`${BASE_URL}/api/v1/emergencies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${farmerToken}`,
    },
    body: JSON.stringify({
      animalId: gauriId,
      symptoms: "Sudden trembling and unable to rise",
      severity: "critical",
      is1962HelplineInbound: true,
    }),
  });
  const emgJson = await emgRes.json();
  assert(emgRes.status === 201, "Emergency case created (HTTP 201)");
  const createdEmgId = emgJson.data?.emergency?.id;

  const acceptEmgRes = await fetch(`${BASE_URL}/api/v1/emergencies/${createdEmgId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${vetToken}` },
  });
  const acceptEmgJson = await acceptEmgRes.json();
  assert(acceptEmgRes.status === 200, "Vet successfully accepted emergency case (HTTP 200)");
  assert(acceptEmgJson.data?.emergency?.status === "accepted", "Status changed to accepted");

  // 15. Notifications
  console.log("\n15. Testing GET & PATCH /api/v1/notifications");
  const notifRes = await fetch(`${BASE_URL}/api/v1/notifications`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const notifJson = await notifRes.json();
  assert(notifRes.status === 200, "Notifications retrieved (HTTP 200)");
  assert(notifJson.data?.notifications?.length > 0, "Farmer has notifications");
  const notifId = notifJson.data?.notifications?.[0]?.id;

  if (notifId) {
    const readNotifRes = await fetch(`${BASE_URL}/api/v1/notifications/${notifId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(readNotifRes.status === 200, "Notification marked as read (HTTP 200)");
  }

  // 16. Outbreak Hotspots (Vet & Admin)
  console.log("\n16. Testing GET /api/v1/surveillance/hotspots");
  const hotspotsRes = await fetch(`${BASE_URL}/api/v1/surveillance/hotspots`, {
    headers: { Authorization: `Bearer ${vetToken}` },
  });
  const hotspotsJson = await hotspotsRes.json();
  assert(hotspotsRes.status === 200, "Vet can list outbreak hotspots (HTTP 200)");
  assert(hotspotsJson.data?.hotspots?.length >= 3, "Hotspots list contains pre-seeded clusters (Nashik, Ahmednagar, Pune)");

  // 17. Admin-Only Complaints: Rejects Non-Admin
  console.log("\n17. Testing Admin Security: RBAC rejects non-admin users");
  const unauthAdminRes = await fetch(`${BASE_URL}/api/v1/complaints/admin`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  assert(unauthAdminRes.status === 403, "Farmer rejected from admin complaints (HTTP 403 Forbidden)");

  const authAdminRes = await fetch(`${BASE_URL}/api/v1/complaints/admin`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminComplaintsJson = await authAdminRes.json();
  assert(authAdminRes.status === 200, "Admin can access complaints (HTTP 200)");
  assert(adminComplaintsJson.data?.complaints?.length >= 2, "Complaints list contains seeded tickets");

  // 18. Soft Delete Animal
  console.log("\n18. Testing DELETE /api/v1/animals/:id (Soft delete)");
  const deleteRes = await fetch(`${BASE_URL}/api/v1/animals/${sundariId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  assert(deleteRes.status === 200, "Animal soft-deleted (HTTP 200)");

  const getDeletedRes = await fetch(`${BASE_URL}/api/v1/animals/${sundariId}`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  assert(getDeletedRes.status === 404, "Soft-deleted animal cannot be fetched directly (HTTP 404)");

  // Final Summary
  console.log("\n====================================================");
  console.log(`🏁 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
