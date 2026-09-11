import sharp from "sharp";

async function testLiveImageScreening() {
  console.log("1. Creating synthetic test image with sharp...");
  const imageBuffer = await sharp({
    create: {
      width: 320,
      height: 240,
      channels: 3,
      background: { r: 160, g: 120, b: 80 },
    },
  })
    .jpeg()
    .toBuffer();

  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

  console.log("2. Logging in as farmer@pashusakhi.in...");
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "farmer@pashusakhi.in", password: "farmer123" }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data?.token;

  console.log("3. Submitting image screening request to Gemini...");
  const res = await fetch("http://localhost:5000/api/v1/diagnostics/symptoms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      animalId: "a1",
      screeningType: "image_detection",
      imageUrl: base64Image,
      reportedSymptoms: ["Skin inspection"],
      notes: "Photo taken of cow's flank area",
    }),
  });

  const resJson = await res.json();
  console.log("\nHTTP Status:", res.status);
  console.log("Triage Result:\n", JSON.stringify(resJson.data?.triage, null, 2));
}

testLiveImageScreening().catch(console.error);
