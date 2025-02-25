
export async function getAIResponse(npcName, playerMessage, collectedEvidence) {
  let prompt = `
  You are ${npcName}, an NPC in a detective game investigating workplace harassment.

  <strong>Case Overview:</strong>
  - <strong>Amy</strong> is the victim.
  - <strong>Emily</strong> is the suspect.
  - Bill left at <strong>8:30 PM</strong>, and a shadowy figure appeared on CCTV between <strong>8:30-8:50 PM</strong> Bill saw shadow figure but couldn't tell who is it.
  - Bill’s laptop sent an <strong>anonymous email</strong> while he was gone.
  - Alex’s laptop has a <strong>draft</strong> of a threatening email.
  - Emily’s laptop has <strong>suspicious browser history</strong> but clean emails.
  - Login records show <strong>Emily and Bill</strong> were logged in at the time of the incident.

  <strong>Your Role:</strong>
  ${npcName === "Amy" ? "<strong>You are the victim who received email at 8:30PM.</strong> You are scared and confused." : ""}
  ${npcName === "Emily" ? "<strong>You are the prime suspect.</strong> You might deny involvement." : ""}
  ${npcName === "Alex" ? "<strong>You are a neutral witness.</strong> Provide useful but non-accusatory information." : ""}
  ${npcName === "Bill" ? "<strong>You are a witness.</strong> You just found out an email was sent from your laptop while you were away." : ""}

  The detective just asked: "<strong>${playerMessage}</strong>".

  <strong>Collected Evidence:</strong> ${collectedEvidence.length > 0 ? collectedEvidence.join(", ") : "No evidence presented"}

  Respond realistically based on your knowledge.
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
        max_tokens: 75,
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
  let isCorrectSuspect = reportData.suspect.toLowerCase() === "emily";

  let prompt = `
  You are an AI investigator reviewing a detective’s case. The detective selected <strong>"${reportData.suspect}"</strong> as the culprit.

  <strong>Case Overview:</strong>
  - <strong>Amy</strong> is the victim.
  - <strong>Emily</strong> is the actual culprit.
  - Bill left at <strong>8:30 PM</strong>; a shadowy figure appeared between <strong>8:30-8:50 PM</strong>.
  - Bill’s laptop sent an <strong>anonymous email</strong> while he was absent.
  - Alex’s laptop contains a <strong>draft</strong> of a threatening email.
  - Emily’s laptop has <strong>suspicious browser history</strong> but clean emails.
  - Login records show both <strong>Emily and Bill</strong> were logged in at the time of the incident.

  <strong>Detective's Reasoning:</strong>
  "<strong>${reportData.detectiveReason}</strong>"

  <strong>Collected Evidence:</strong>
  ${reportData.evidence.length > 0 ? reportData.evidence.join(", ") : "No key evidence was collected."}

  <strong>Chat History with NPCs:</strong>
  ${reportData.chatHistory}

  <strong>Evaluate the detective’s conclusion:</strong>
  - Did they correctly identify Emily? ${isCorrectSuspect ? "<strong>✅ Yes, they correctly identified the culprit.</strong>" : "<strong>❌ No, the selected suspect is incorrect.</strong>"}
  - Was the reasoning strong? Analyze if the detective used logical deduction based on the evidence.
  - Was any critical evidence missing?
  - Provide a <strong>final verdict</strong>: If they were correct, confirm their accuracy. If incorrect, suggest the right suspect with reasoning.
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
        max_tokens: 300,
      }),
    });

    let data = await response.json();
    return data.choices?.[0]?.message?.content || "Could not generate report.";
  } catch (error) {
    return "Error generating report.";
  }
}