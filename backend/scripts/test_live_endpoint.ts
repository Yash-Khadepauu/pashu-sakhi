async function testLiveEndpoint() {
  console.log("1. Logging in as farmer@pashusakhi.in...");
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "farmer@pashusakhi.in", password: "farmer123" }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data?.token;
  console.log("Token obtained:", token ? "YES" : "NO");

  console.log("\n2. Submitting screening request with live Gemini API...");
  const diagRes = await fetch("http://localhost:5000/api/v1/diagnostics/symptoms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      animalId: "a1", // Frontend stub ID
      reportedSymptoms: ["sym_skinnodules", "sym_fever"],
      temperatureSelected: "High",
      appetiteSelected: "Reduced",
      activitySelected: "Low",
      notes: "Cow has multiple raised circular skin bumps on neck and high fever",
    }),
  });

  const diagJson = await diagRes.json();
  console.log("\nHTTP Status:", diagRes.status);
  console.log("Full Live API Response:\n", JSON.stringify(diagJson, null, 2));
}

testLiveEndpoint().catch(console.error);
