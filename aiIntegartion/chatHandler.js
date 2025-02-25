import * as THREE from '../js/libs/three.module.js';
import { camera } from './setup.js';
import { handlePlayerMessage } from './npcInteraction.js';
import { getNearestNPC } from './main.js';


const SERVER_URL = "http://localhost:3001"; // Updated safe port

/**
 * Create the Detective Chat Box (Hidden Initially)
 */

export async function createDetectiveChatBox(npcName) {
  let chatContainer = document.getElementById("chat-container");

  // Remove previous chat UI
  document.querySelectorAll(".detective-chat").forEach(chat => chat.remove());

  let detectiveChat = document.createElement("div");
  detectiveChat.className = "chat-bubble detective-chat";
  detectiveChat.style.display = "none"; // Hidden initially

  // ✅ Chat UI (Header, Chat History, Input Field)
  detectiveChat.innerHTML = `
    <div class="chat-header">
      <strong>Detective:</strong>
      <button class="toggle-chat">Previous Chats</button>
    </div>
    <div id="chat-history" class="chat-content" style="display: none;"></div>
    <div class="chat-input-container">
      <input type="text" id="detective-input" placeholder="Ask a question..." autocomplete="off" />
      <button id="send-message">Send</button>
    </div>
  `;

  let toggleButton = detectiveChat.querySelector(".toggle-chat");
  toggleButton.onclick = function () {
    let chatHistoryDiv = document.getElementById("chat-history");

    if (chatHistoryDiv.style.display === "none") {
      chatHistoryDiv.style.display = "block";
      toggleButton.innerText = "Hide Previous Chats"; // Change button text
    } else {
      chatHistoryDiv.style.display = "none";
      toggleButton.innerText = "Previous Chats"; // Reset button text
    }
  };

  chatContainer.appendChild(detectiveChat);

  const inputField = document.getElementById("detective-input");
  const sendButton = document.getElementById("send-message");

  // ✅ Disable movement while typing
  inputField.addEventListener("focus", () => (window.disableMovement = true));
  inputField.addEventListener("blur", () => (window.disableMovement = false));

  // ✅ Load Previous Chat Messages (Initially Hidden)
  await loadChatHistory(npcName);

  sendButton.onclick = async function (event) {
    event.preventDefault();
    let playerMessage = inputField.value.trim();
    if (!playerMessage) return;

    let nearestNPC = getNearestNPC();
    if (!nearestNPC) return;

    // ✅ Dynamically update chat before waiting for AI response
    updateChatUI("Detective", playerMessage);

    // ✅ Get NPC response
    let response = await handlePlayerMessage(nearestNPC, playerMessage);

    inputField.value = "";
  };
}

/**
 * 📌 Updates the Chat UI Dynamically
 */
export async function updateChatUI(sender, message) {
  let chatHistoryDiv = document.getElementById("chat-history");
  let messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatHistoryDiv.appendChild(messageElement);

  // ✅ Auto-scroll to the latest message
  chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

/**
 * 📌 Loads Previous Chat History and Updates UI
 */
async function loadChatHistory(npcName) {
  if (!npcName) {
    console.error("❌ No NPC Name provided for chat history.");
    return;
  }

  try {
    let response = await fetch(`${SERVER_URL}/chat/${npcName}`);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    let data = await response.json();
    let chatHistoryDiv = document.getElementById("chat-history");
    chatHistoryDiv.innerHTML = "";

    if (!data.messages || data.messages.length === 0) {
      chatHistoryDiv.innerHTML = "<p>No previous chat found.</p>";
      return;
    }

    data.messages.forEach(msg => {
      updateChatUI(msg.sender, msg.text);
    });

  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
  }
}

/**
 * Show Chat Box When Near NPC
 */
export function showChat(npc) {
  let chatBox = document.querySelector(".detective-chat");

  if (!chatBox) {
    createDetectiveChatBox(npc.name);
  } else {
    chatBox.style.display = "block";
  }
}


/**
 * Hide Chat Box When Moving Away
 */
export function hideChat() {
  let chatBox = document.querySelector(".detective-chat");
  if (chatBox) chatBox.style.display = "none";
}

/**
 * Position Chat Above Detective’s Head
 */
export function updateChatPosition(character) {
  let chatBox = document.querySelector(".detective-chat");
  if (!chatBox || !character) return;

  let charPosition = new THREE.Vector3();
  character.getWorldPosition(charPosition);
  charPosition.y += 1.5; // Adjust height

  let screenPosition = charPosition.project(camera);
  let screenX = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
  let screenY = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;

  chatBox.style.position = "absolute";
  chatBox.style.left = `${screenX - chatBox.clientWidth / 2}px`;
  chatBox.style.top = `${screenY - 50}px`;
}
