export async function getAIResponse(npcName, playerMessage, collectedEvidence) {
  try {
    let response = await fetch("http://localhost:3001/api/get-ai-response", { // Backend API call
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ npcName, playerMessage, collectedEvidence }),
    });

    let data = await response.json();
    return data.message;
  } catch (error) {
    console.error("❌ Error getting AI response:", error);
    return "Error getting AI response.";
  }
}

export async function getAIReport(reportData) {
  try {
    let response = await fetch("http://localhost:3001/api/get-ai-report", { // Backend API call
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportData }),
    });

    let data = await response.json();
    return data.message;
  } catch (error) {
    console.error("❌ Error generating report:", error);
    return "Error generating report.";
  }
}
