import { collectedEvidence } from '../3dOffice/setup.js';
const SERVER_URL = "http://localhost:3001";

export async function generateGameSummary() {
  let response = await fetch(`${SERVER_URL}/chat/history`);
  let chatData = await response.json();

  return {
    evidence: collectedEvidence, // ✅ List of collected evidence
    chatHistory: chatData.messages.map(msg => `${msg.sender}: ${msg.text}`).join("\n"), // ✅ Convert chat to readable format
    suspect: "", // ✅ Placeholder, updated in `main.js`
    detectiveReason: "" // ✅ Placeholder, updated in `main.js`
  };
}
