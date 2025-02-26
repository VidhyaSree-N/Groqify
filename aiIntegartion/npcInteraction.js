import * as THREE from '../js/libs/three.module.js';
import { getAIResponse } from './openAIService.js';
import { collectedEvidence, camera } from '../3dOffice/setup.js';
import { updateChatUI } from "./chatHandler.js";
import { character } from "../3dOffice/main.js"; // ✅ Import detective character from main.js

const SERVER_URL = "http://localhost:3001"; // Updated safe port
const CHAT_DISAPPEAR_DISTANCE = 2; // ✅ Distance at which NPC chat disappears

/**
 * Handles player message and generates NPC response
 */
export async function handlePlayerMessage(npc, playerMessage) {
  let response = await getAIResponse(npc.name, playerMessage, collectedEvidence);

  // ✅ Save Player Message
  saveChatMessage(npc.name, "Detective", playerMessage);
  // ✅ Save NPC Response
  saveChatMessage(npc.name, npc.name, response);

  updateNPCChatBox(npc, response);
  updateChatUI(npc.name, response);
}

/**
 * Saves Chat Message to MongoDB
 */
export async function saveChatMessage(npcName, sender, text) {
  try {
    let response = await fetch(`${SERVER_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npcName, sender, text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    console.log("✅ Chat message saved successfully!");
  } catch (error) {
    console.error("❌ Error saving chat:", error);
  }
}

/**
 * Displays NPC chat above NPC
 */
function updateNPCChatBox(npc, response) {
  let chatContainer = document.getElementById("chat-container");

  // Remove previous chat
  document.querySelectorAll(".npc-chat").forEach(chat => chat.remove());

  let npcChat = document.createElement("div");
  npcChat.className = "chat-bubble npc-chat";
  npcChat.innerHTML = `<strong>${npc.name}:</strong> ${response}`;
  chatContainer.appendChild(npcChat);

  positionChatAboveNPC(npc, npcChat);
}

/**
 * Positions NPC chat bubble above NPC and hides it when detective moves away
 */
function positionChatAboveNPC(npc, chatBubble) {
  function updatePosition() {
    if (!npc.object || !character) return;

    let npcWorldPosition = new THREE.Vector3();
    let detectiveWorldPosition = new THREE.Vector3();

    npc.object.getWorldPosition(npcWorldPosition);
    character.getWorldPosition(detectiveWorldPosition);

    let distance = npcWorldPosition.distanceTo(detectiveWorldPosition);

    if (distance > CHAT_DISAPPEAR_DISTANCE) {
      chatBubble.style.display = "none"; // ✅ Hide chat if detective is far
    } else {
      chatBubble.style.display = "block"; // ✅ Show chat if detective is near
    }

    npcWorldPosition.y += 1.0;
    let npcScreenPosition = npcWorldPosition.project(camera);
    let screenX = (npcScreenPosition.x * 0.5 + 0.5) * window.innerWidth;
    let screenY = (-npcScreenPosition.y * 0.5 + 0.5) * window.innerHeight;

    chatBubble.style.position = "absolute";
    chatBubble.style.left = `${screenX - chatBubble.clientWidth / 2}px`;
    chatBubble.style.top = `${screenY - 50}px`;
  }

  function updateFrame() {
    if (npc.object) updatePosition();
    requestAnimationFrame(updateFrame);
  }
  updateFrame();
}
