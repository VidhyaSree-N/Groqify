
export async function getAIResponse(npcName, playerMessage, collectedEvidence) {
  let prompt = `
  You are ${npcName}, an NPC in a detective game investigating workplace harassment.
  The detective just asked: "${playerMessage}".
  Respond based on the case and evidence: ${collectedEvidence.length > 0 ? collectedEvidence.join(", ") : "None"}.
  `;

  try {
    let response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    let data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    return "I'm not sure what to say about that.";
  }
}
export async function getAIReport(reportData) {
  let prompt = `
  You are an AI investigator reviewing a detective’s case.
  The detective selected "${reportData.suspect}" as the culprit.
  Reasoning: "${reportData.detectiveReason}"

  The detective gathered the following evidence: ${reportData.evidence.join(", ")}
  Chat History with NPCs: ${reportData.chatHistory}

  Evaluate the detective’s decision.
  - Was the selected culprit the most likely suspect?
  - Did the detective provide strong reasoning?
  - Did they miss any key evidence?
  - Provide feedback on their performance.
  - Give a final conclusion based on the investigation.
  `;

  try {
    let response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 250,
      }),
    });

    let data = await response.json();
    return data.choices?.[0]?.message?.content || "Could not generate report.";
  } catch (error) {
    return "Error generating report.";
  }
}


