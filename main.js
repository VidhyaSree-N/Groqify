import * as THREE from './js/libs/three.module.js';
import { scene, camera, controls, renderer, gltfLoader, npcs, collidableObjects, officeBoundingBox,evidenceObjects, collectedEvidence, screenMesh, cctvScreen, video, videoTexture} from './setup.js';

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
 * Create an AI-Driven NPC Chat Bubble
 */
function createNPCChatBox(npc) {
  let chatContainer = document.getElementById("chat-container");

  // ✅ Remove old NPC chat bubbles
  document.querySelectorAll(".npc-chat").forEach(chat => chat.remove());

  // ✅ Generate dynamic response based on evidence collected
  let npcDialogue = generateNPCDialogue(npc);

  let npcChat = document.createElement("div");
  npcChat.className = "chat-bubble npc-chat";
  npcChat.innerHTML = `<strong>${npc.name}:</strong> ${npcDialogue}`;
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
 * AI-Generated NPC Dialogue
 */
function generateNPCDialogue(npc) {
  let evidenceCount = collectedEvidence.length;

  if (npc.name === "victimEmployee") {
    if (evidenceCount === 0) return "I don't feel safe at work. Do you believe me?";
    if (collectedEvidence.includes("CCTV Footage")) return "The CCTV footage proves my story! Will you help me report this?";
    if (collectedEvidence.includes("Login/Logout Records")) return "The records might show who was near my desk when I received those messages.";
    return "Thank you for listening... I hope you find something.";
  }

  if (npc.name === "seniorEmployee") {
    if (collectedEvidence.includes("Threatening Messages")) return "I... I didn't mean for them to take it that way.";
    if (collectedEvidence.includes("CCTV Footage")) return "The CCTV? What did you see?";
    return "If you're looking for answers, you should check with the junior staff.";
  }

  return npc.dialogue;
}
let lastEvidenceCollectedTime = Date.now();

/**
 * AI-Driven Hint System (Now Appears Inside the Scene with Sprite-Based Text)
 */
function checkForHint() {
  let timeSinceLastEvidence = (Date.now() - lastEvidenceCollectedTime) / 1000; // In seconds

  if (timeSinceLastEvidence > 5) {  // If no evidence found in 20 seconds
    provideHint();
  }
}

/**
 * Provide AI Hint Based on Missing Evidence
 */
function provideHint() {
  let missingEvidence = ["CCTV Footage", "Threatening Messages", "Login/Logout Records"]
      .filter(item => !collectedEvidence.includes(item));

  if (missingEvidence.length > 0) {
    let hintMessage = `💡 Hint: Check ${missingEvidence[0]}`;
    displayHintInScene(hintMessage);
  }
}

/**
 * Display AI Hint Inside the Three.js Scene as a Floating Sprite
 */
function displayHintInScene(message) {
  // Remove old hint if it exists
  let oldHint = scene.getObjectByName("HintText");
  if (oldHint) scene.remove(oldHint);

  // Create a canvas to draw text
  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d");
  let fontSize = 24;
  canvas.width = 512;
  canvas.height = 256;

  // Set font and style
  context.fillStyle = "rgba(255, 255, 0, 1)";  // Yellow text
  context.font = `bold ${fontSize}px Arial`;
  context.textAlign = "center";
  context.fillText(message, canvas.width / 2, canvas.height / 2);

  // Create texture from canvas
  let texture = new THREE.CanvasTexture(canvas);
  let material = new THREE.SpriteMaterial({ map: texture, transparent: true });

  // Create sprite
  let hintSprite = new THREE.Sprite(material);
  hintSprite.name = "HintText";
  hintSprite.scale.set(3, 1.5, 1); // Adjust size of hint
  hintSprite.position.set(character.position.x, character.position.y + 1.5, character.position.z);

  scene.add(hintSprite);

  // Animate the hint to fade out
  let fadeOutTime = 5; // Seconds
  let startTime = Date.now();

  function fadeHint() {
    let elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= fadeOutTime) {
      scene.remove(hintSprite);
    } else {
      hintSprite.material.opacity = Math.max(1.0 - (elapsed / fadeOutTime), 0);
      requestAnimationFrame(fadeHint);
    }
  }
  fadeHint();
}

// Check for hints every 10 seconds
setInterval(checkForHint, 10000);


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
function applyGlowEffect(object, intensity = 5.0) {
  if (!object || !object.material) return;

  // Convert to MeshStandardMaterial if needed
  if (!(object.material instanceof THREE.MeshStandardMaterial)) {
    object.material = new THREE.MeshStandardMaterial({
      color: object.material.color || new THREE.Color(0xffffff),
      map: object.material.map || null,
      emissive: new THREE.Color(0xff0000), // 🔴 RED glow for everything
      emissiveIntensity: intensity,
      roughness: 0.4,
      metalness: 0.3,
    });
  } else {
    object.material.emissive = new THREE.Color(0xff0000);
    object.material.emissiveIntensity = intensity;
    object.material.needsUpdate = true;
  }
}
function updateEvidenceGlow() {
  if (!character) return;

  const glowDistance = 5.0; // Distance threshold to apply glow

  // Include all evidence items
  const allEvidenceObjects = [...evidenceObjects, screenMesh, cctvScreen];

  allEvidenceObjects.forEach((object) => {
    if (!object) return;
    const distance = character.position.distanceTo(object.position);

    let evidenceLabel = document.getElementById(`evidence-label-${object.uuid}`);

    if (distance < glowDistance) {
      applyGlowEffect(object, 10.0); // Super strong red glow

      // Create label if it doesn't exist
      if (!evidenceLabel) {
        evidenceLabel = document.createElement("div");
        evidenceLabel.id = `evidence-label-${object.uuid}`;
        evidenceLabel.className = "evidence-label";
        evidenceLabel.innerText = "🔍 Click to collect evidence";
        document.body.appendChild(evidenceLabel);
      }

      // Position label above the evidence in 2D screen space
      const objectPosition = object.position.clone().project(camera);
      const screenX = (objectPosition.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-objectPosition.y * 0.5 + 0.5) * window.innerHeight;

      evidenceLabel.style.position = "absolute";
      evidenceLabel.style.left = `${screenX}px`;
      evidenceLabel.style.top = `${screenY}px`;
      evidenceLabel.style.display = "block";

    } else {
      applyGlowEffect(object, 0.0); // Remove glow

      // Hide the label if it exists
      if (evidenceLabel) {
        evidenceLabel.style.display = "none";
      }
    }
  });

  // 🚨 Ensure CCTV **ALWAYS** uses MeshBasicMaterial for video rendering
  if (cctvScreen && !(cctvScreen.material instanceof THREE.MeshBasicMaterial)) {
    cctvScreen.material = new THREE.MeshBasicMaterial({
      map: videoTexture, // Assign back the video texture
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });
  }
}


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
  updateEvidenceGlow();

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

// window.addEventListener("click", (event) => {
//   let mouse = new THREE.Vector2(
//     (event.clientX / window.innerWidth) * 2 - 1,
//     -(event.clientY / window.innerHeight) * 2 + 1
//   );
//
//   let raycaster = new THREE.Raycaster();
//   raycaster.setFromCamera(mouse, camera);
//
//   let intersects = raycaster.intersectObjects(scene.children, true); // Check all objects
//
//   if (intersects.length > 0) {
//     let clickedObject = intersects[0].object;
//     console.log(`🔍 Clicked Object: ${clickedObject.name}, Position: ${clickedObject.position.toArray()}`);
//   }
// });
function updateVideoTexture() {
  if (video.readyState >= video.HAVE_ENOUGH_DATA) {
    videoTexture.needsUpdate = true;
  }
  requestAnimationFrame(updateVideoTexture);
}
updateVideoTexture();


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

export function showVictimNarrationNearNPC() {
  let victimNPC = npcs.find(npc => npc.name === "victimEmployee");

  if (!victimNPC || !victimNPC.object) {
    setTimeout(showVictimNarrationNearNPC, 500); // Retry until NPC loads
    return;
  }

  let narrationDiv = document.createElement("div");
  narrationDiv.id = "victim-narration";
  narrationDiv.style.position = "absolute";
  narrationDiv.style.background = "rgba(0, 255, 200, 0.8)";
  narrationDiv.style.color = "black";
  narrationDiv.style.padding = "10px 15px";
  narrationDiv.style.borderRadius = "8px";
  narrationDiv.style.fontSize = "16px";
  narrationDiv.style.fontWeight = "bold";
  narrationDiv.style.zIndex = "10000";
  narrationDiv.style.textAlign = "center";
  narrationDiv.style.maxWidth = "300px";
  narrationDiv.innerHTML =
      "I’ve been receiving threatening messages that started as passive-aggressive remarks and have escalated to outright threats. I don’t feel safe at work.";

  document.body.appendChild(narrationDiv);

  function updateNarrationPosition() {
    if (!victimNPC.object) return;

    let npcPosition = new THREE.Vector3();
    victimNPC.object.getWorldPosition(npcPosition);
    npcPosition.y += 2.0; // Position slightly above the NPC

    let screenPosition = npcPosition.project(camera);
    let screenX = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
    let screenY = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;

    narrationDiv.style.left = `${screenX - narrationDiv.clientWidth / 2}px`;
    narrationDiv.style.top = `${screenY}px`;
  }

  function animateNarration() {
    updateNarrationPosition();
    if (narrationDiv) requestAnimationFrame(animateNarration);
  }
  animateNarration();

  setTimeout(() => {
    narrationDiv.remove();
  }, 5000);
}
