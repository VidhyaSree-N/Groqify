import * as THREE from './js/libs/three.module.js';
import { scene, camera, controls, renderer, gltfLoader, npcs, collidableObjects, officeBoundingBox,evidenceObjects, collectedEvidence, screenMesh, cctvScreen } from './setup.js';

/**
 * Load Detective Character
 */
let character;
const characterSpeed = 0.1;
const movement = { forward: false, backward: false, left: false, right: false };

gltfLoader.load('dec_tex.glb', (gltf) => {
  console.log("✅ Character Loaded");
  character = gltf.scene;
  character.position.set(3.2, 1.9, 15);
  character.scale.set(1.4, 1.4, 1.4);
  character.rotation.y = Math.PI;
  character.boundingBox = new THREE.Box3().setFromObject(character);
  scene.add(character);

  // ✅ Chat box starts hidden but is always typable when shown
  createDetectiveChatBox();
});

/**
 * Create a Chat Box Above the Detective’s Head (Hidden Initially)
 */
/**
 * Create a Chat Box Above the Detective’s Head (Hidden Initially)
 */
function createDetectiveChatBox() {
  let chatContainer = document.getElementById("chat-container");

  // ✅ Remove any old chat box
  document.querySelectorAll(".detective-chat").forEach(chat => chat.remove());

  // ✅ Create new chat box
  let detectiveChat = document.createElement("div");
  detectiveChat.className = "chat-bubble detective-chat";
  detectiveChat.innerHTML = `
    <strong>Detective:</strong><br>
    <input type="text" id="detective-input" placeholder="Type your message..." autocomplete="off" />
    <button id="send-message">Send</button>
  `;
  chatContainer.appendChild(detectiveChat);

  // ✅ Keep input field always focused
  function keepFocus() {
    let inputField = document.getElementById("detective-input");
    if (inputField) {
      inputField.focus();
      inputField.setSelectionRange(inputField.value.length, inputField.value.length); // Keep cursor at end
    }
  }
  setInterval(keepFocus, 100); // ✅ Ensures focus stays

  let inputField = document.getElementById("detective-input");
  let sendButton = document.getElementById("send-message");

  // ✅ Ensure chat box is always interactive
  inputField.style.pointerEvents = "auto";
  inputField.style.zIndex = "2000";
  sendButton.style.pointerEvents = "auto";
  sendButton.style.zIndex = "2000";

  inputField.addEventListener("click", (event) => event.stopPropagation());

  // ✅ Handle sending messages when clicking "Send"
  sendButton.onclick = function () {
    let playerMessage = inputField.value.trim();
    if (!playerMessage) return; // Prevent empty messages

    console.log("📝 Detective says:", playerMessage);

    // ✅ Keep chat open, replace input with message text
    detectiveChat.innerHTML = `<strong>Detective:</strong> ${playerMessage}
      <br><input type="text" id="detective-input" placeholder="Type your message..." autocomplete="off" />
      <button id="send-message">Send</button>`;

    // ✅ Restore input field & focus
    let newInputField = document.getElementById("detective-input");
    let newSendButton = document.getElementById("send-message");

    newInputField.focus();
    newSendButton.onclick = sendButton.onclick; // ✅ Ensure clicking again works
  };

  // ✅ Position chat box above detective’s head
  function updateChatPosition() {
    if (!character) return;
    let characterWorldPosition = new THREE.Vector3();
    character.getWorldPosition(characterWorldPosition);
    characterWorldPosition.y += 1.5;

    let characterScreenPosition = characterWorldPosition.project(camera);
    let screenX = (characterScreenPosition.x * 0.5 + 0.5) * window.innerWidth;
    let screenY = (-characterScreenPosition.y * 0.5 + 0.5) * window.innerHeight;

    detectiveChat.style.position = "absolute";
    detectiveChat.style.left = `${screenX - detectiveChat.clientWidth / 2}px`;
    detectiveChat.style.top = `${screenY - 50}px`;
  }

  function updateChatFrame() {
    if (character) updateChatPosition();
    requestAnimationFrame(updateChatFrame);
  }
  updateChatFrame();
}


/**
 * Create an NPC Chat Bubble
 */
function createNPCChatBox(npc) {
  let chatContainer = document.getElementById("chat-container");

  // ✅ Remove old NPC chat bubbles
  document.querySelectorAll(".npc-chat").forEach(chat => chat.remove());

  // ✅ Create new NPC chat bubble
  let npcChat = document.createElement("div");
  npcChat.className = "chat-bubble npc-chat";
  npcChat.innerHTML = `<strong>${npc.name}:</strong> ${npc.dialogue}`;
  chatContainer.appendChild(npcChat);

  function updateNPCChatPosition() {
    if (!npc.object) return;
    let npcWorldPosition = new THREE.Vector3();
    npc.object.getWorldPosition(npcWorldPosition);
    npcWorldPosition.y += 1.0;

    let npcScreenPosition = npcWorldPosition.project(camera);
    let screenX = (npcScreenPosition.x * 0.5 + 0.5) * window.innerWidth;
    let screenY = (-npcScreenPosition.y * 0.5 + 0.5) * window.innerHeight;

    npcChat.style.position = "absolute";
    npcChat.style.left = `${screenX - npcChat.clientWidth / 2}px`;
    npcChat.style.top = `${screenY - 50}px`;
  }

  function updateNPCChatFrame() {
    if (npc.object) updateNPCChatPosition();
    requestAnimationFrame(updateNPCChatFrame);
  }
  updateNPCChatFrame();
}

/**
 * Show Chat Box When Near NPC
 */
function showChat(npc) {
  let chatBox = document.querySelector(".detective-chat");
  if (chatBox) chatBox.style.display = "block"; // ✅ Detective chat
  createNPCChatBox(npc); // ✅ NPC chat
}

/**
 * Hide Chat Box When Moving Away
 */
function hideChat() {
  let chatBox = document.querySelector(".detective-chat");
  let npcChat = document.querySelector(".npc-chat");
  if (chatBox) chatBox.style.display = "none";
  if (npcChat) npcChat.remove();
}

/**
 * Check NPC Interactions (Toggle Chat Box & NPC Chat Visibility)
 */
function checkInteraction() {
  if (!character) return;

  let nearestNPC = null;
  let minDistance = Infinity;

  npcs.forEach(npc => {
    if (npc.object) {
      let distance = character.position.distanceTo(npc.object.position);
      if (distance < 2 && distance < minDistance) {
        nearestNPC = npc;
        minDistance = distance;
      }
    }
  });

  if (nearestNPC) {
    showChat(nearestNPC);
  } else {
    hideChat();
  }
}
/**
 * Collision Detection
 */
function checkCollision(newPosition) {
  if (!character || collidableObjects.length === 0 || !officeBoundingBox) return false;

  character.boundingBox.setFromObject(character);
  character.boundingBox.translate(newPosition.clone().sub(character.position));

  for (let obj of collidableObjects) {
    if (!obj.boundingBox) continue;
    if (character.boundingBox.intersectsBox(obj.boundingBox)) return true;
  }

  if (!officeBoundingBox.containsPoint(newPosition)) return true;

  return false;
}

/**
 * Evidence Collection System
 */
// let collectedEvidence = [];

/**
 * **📌 Make Evidence Clickable Without Hiding Objects**
 */
window.addEventListener("click", (event) => {
  let mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
  );

  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  let intersects = raycaster.intersectObjects([...evidenceObjects, screenMesh, cctvScreen]); // Make sure all evidence is clickable

  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;
    let evidenceName = clickedObject.name || (clickedObject === screenMesh ? "Login/Logout Records" : "CCTV Footage");

    if (!collectedEvidence.includes(evidenceName)) {
      collectedEvidence.push(evidenceName);
      alert(`🕵️ Evidence Collected: ${evidenceName}`);
      console.log(`✅ Evidence Collected: ${evidenceName}`);
    } else {
      alert(`🕵️ You already collected this evidence.`);
    }
  }
});

/**
 * Character Movement Handling (No Changes to Movement)
 */
function moveCharacter() {
  if (!character || !officeBoundingBox) return;

  let newPosition = character.position.clone();
  let moved = false;

  if (movement.forward) {
    newPosition.z -= characterSpeed;
    character.rotation.y = Math.PI;
    moved = true;
  }
  if (movement.backward) {
    newPosition.z += characterSpeed;
    character.rotation.y = 0;
    moved = true;
  }
  if (movement.left) {
    newPosition.x -= characterSpeed;
    character.rotation.y = -Math.PI / 2;
    moved = true;
  }
  if (movement.right) {
    newPosition.x += characterSpeed;
    character.rotation.y = Math.PI / 2;
    moved = true;
  }

  if (moved && !checkCollision(newPosition)) {
    character.position.copy(newPosition);
  }

  checkInteraction();

  let cameraPosition = new THREE.Vector3(
      Math.min(character.position.x + 0, officeBoundingBox.max.x - 4),
      character.position.y + 2,
      character.position.z + 5
  );
  camera.position.copy(cameraPosition);

  controls.target.set(character.position.x, character.position.y, character.position.z);

}

/**
 * Detects if the detective is near a wall
 */
function isNearWall(position) {
  let wallThreshold = 2.5; // Distance to trigger wall camera adjustment
  return (
      position.x <= officeBoundingBox.min.x + wallThreshold ||
      position.x >= officeBoundingBox.max.x - wallThreshold ||
      position.z <= officeBoundingBox.min.z + wallThreshold ||
      position.z >= officeBoundingBox.max.z - wallThreshold
  );
}


/**
 * Keyboard Event Listeners
 */
window.addEventListener('keydown', (event) => {
  if (event.key === 'w' || event.key === 'ArrowUp') movement.forward = true;
  if (event.key === 's' || event.key === 'ArrowDown') movement.backward = true;
  if (event.key === 'a' || event.key === 'ArrowLeft') movement.left = true;
  if (event.key === 'd' || event.key === 'ArrowRight') movement.right = true;
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'w' || event.key === 'ArrowUp') movement.forward = false;
  if (event.key === 's' || event.key === 'ArrowDown') movement.backward = false;
  if (event.key === 'a' || event.key === 'ArrowLeft') movement.left = false;
  if (event.key === 'd' || event.key === 'ArrowRight') movement.right = false;
});

/**
 * Animation Loop
 */
const tick = () => {
  controls.update();
  moveCharacter();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};
tick();
