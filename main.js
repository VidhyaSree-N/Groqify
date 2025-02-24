import * as THREE from './js/libs/three.module.js';
import './evidenceSystem.js';  // Ensure Evidence system is loaded
import { scene, camera, controls, renderer, gltfLoader, npcs, collidableObjects, officeBoundingBox,evidenceObjects, collectedEvidence, screenMesh, cctvScreen, video, videoTexture} from './setup.js';
import { createDetectiveChatBox, showChat, hideChat, updateChatPosition} from './chatHandler.js';
import { collectEvidence, updateEvidenceList } from './evidenceSystem.js';

/**
 * Load Detective Character
 */
export let character;
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

  // // ✅ Chat box starts hidden but is always typable when shown
  // createDetectiveChatBox();
});

let lastEvidenceCollectedTime = Date.now();

/**
 * AI-Driven Hint System (Now Appears Inside the Scene with Sprite-Based Text)
 */
function checkForHint() {
  let timeSinceLastEvidence = (Date.now() - lastEvidenceCollectedTime) / 1000; // In seconds

  if (timeSinceLastEvidence > 25) {  // If no evidence found in 20 seconds
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
  let fadeOutTime = 4; // Seconds
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
 * Check if Detective is Near an NPC and Show Chat
 */
function checkInteraction() {
  let nearestNPC = getNearestNPC();
  if (nearestNPC) {
    showChat(nearestNPC);
  } else {
    hideChat();
  }
}

/**
 * Finds the nearest NPC
 */
export function getNearestNPC() {
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

  return nearestNPC;
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

function applyGlowEffect(object, intensity = 0.3) {
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
      applyGlowEffect(object, 0.3); // Super strong red glow

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
  if (!character || !officeBoundingBox || window.disableMovement ) return;

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
  updateChatPosition(character);

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

import { getAIReport } from './openAIService.js';
import { generateGameSummary } from './gameSummary.js';

const modal = document.getElementById("report-modal");
const reportStep1 = document.getElementById("report-step-1");
const reportStatus = document.getElementById("report-status");
const reportContent = document.getElementById("report-content");
const endGameButton = document.getElementById("end-game");

// Step 1: Open the report submission modal
document.getElementById("submit-report").addEventListener("click", () => {
  modal.style.display = "flex"; // Show modal
  reportStep1.style.display = "block"; // Show step 1
  reportStatus.style.display = "none";
  reportContent.style.display = "none";
  endGameButton.style.display = "none";
});

// Step 2: Submit suspect selection & explanation
document.getElementById("submit-suspect").addEventListener("click", async () => {
  let suspect = document.getElementById("suspect-selection").value;
  let detectiveReason = document.getElementById("detective-reason").value.trim();

  if (!suspect) {
    alert("⚠️ Please select a suspect before submitting!");
    return;
  }

  // Show "Generating Report..."
  reportStep1.style.display = "none";
  reportStatus.style.display = "block";

  // ✅ Gather game data
  let reportData = await generateGameSummary();
  reportData.suspect = suspect;
  reportData.detectiveReason = detectiveReason || "No additional reasoning provided.";

  // ✅ Generate AI Report
  let aiReport = await getAIReport(reportData);

  // Step 3: Show AI Report
  reportStatus.style.display = "none"; // Hide "Generating Report..."
  reportContent.style.display = "block"; // Show AI Report
  reportContent.innerHTML = aiReport;
  endGameButton.style.display = "block"; // Show "End Game" button
});

// Step 4: End Game
endGameButton.addEventListener("click", () => {
  modal.style.display = "none"; // Hide modal
  disableGameInteractions();
  alert("🔍 Case Closed! The investigation has ended.");
});

// Function to disable movement & interactions
function disableGameInteractions() {
  window.disableMovement = true;
  document.getElementById("submit-report").disabled = true; // Disable submit button
}
// Function to disable movement when typing
function disableMovementOnTyping() {
  const suspectInput = document.getElementById("suspect-selection");
  const reasonInput = document.getElementById("detective-reason");

  // When user starts typing, disable movement
  suspectInput.addEventListener("focus", () => window.disableMovement = true);
  reasonInput.addEventListener("focus", () => window.disableMovement = true);

  // When user stops typing, re-enable movement
  suspectInput.addEventListener("blur", () => window.disableMovement = false);
  reasonInput.addEventListener("blur", () => window.disableMovement = false);
}

// Call function to apply event listeners
disableMovementOnTyping();

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
  let victimNPC = npcs.find(npc => npc.name === "Amy");

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




