import * as THREE from './js/libs/three.module.js';
import { camera } from './setup.js'; // Ensure camera access
import { evidenceObjects, collectedEvidence, screenMesh, cctvScreen, scene } from './setup.js';
import { character } from './main.js';

/**
 * UI Elements
 */
const evidenceIcon = document.getElementById("evidence-icon");
const evidenceContainer = document.getElementById("evidence-container");
const evidenceList = document.getElementById("evidence-list");

/**
 * 📌 Toggle the evidence list on click
 */
evidenceIcon.addEventListener("click", () => {
  evidenceContainer.style.display =
    evidenceContainer.style.display === "none" ? "block" : "none";
});

/**
 * 📌 Updates the UI list of collected evidence and makes items clickable
 */
export function updateEvidenceList() {
  evidenceList.innerHTML = ""; // Clear previous items
  collectedEvidence.forEach((evidence) => {
    let li = document.createElement("li");
    li.textContent = evidence;
    li.classList.add("clickable-evidence"); // Add class for styling
    li.addEventListener("click", () => handleEvidenceClick(evidence)); // Handle click
    evidenceList.appendChild(li);
  });
}

/**
 * 📌 Handles what happens when an evidence item is clicked
 */
function handleEvidenceClick(evidenceName) {
  if (evidenceName.includes("Laptop")) {
    openEmailsForLaptop(evidenceName);
  } else if (evidenceName === "CCTV Footage") {
    moveDetectiveToCCTV();
  } else if (evidenceName === "Login/Logout Records") {
    openLoginLogoutTimesheet();
  } else {
    alert(`No special action for ${evidenceName} yet.`);
  }
}

/**
 * 📨 Open emails when clicking a laptop
 */
function openEmailsForLaptop(laptopName) {
  // Sample email data for different employees
  const emailData = {
    "Alex's Laptop": [
      { sender: "hr@company.com", subject: "Policy Reminder", body: "Reminder about workplace harassment policies." },
      { sender: "anonymous@unknown.com", subject: "Stop this now!", body: "You better not report this. Watch yourself!" }
    ],
    "Emily's Laptop": [
      { sender: "team@company.com", subject: "Meeting Notes", body: "Notes from last week's team meeting." },
      { sender: "anonymous@unknown.com", subject: "You’re next!", body: "Think twice before taking sides." }
    ],
    "Bill's Laptop": [
      { sender: "it@company.com", subject: "Password Change", body: "Your password was changed successfully." },
      { sender: "anonymous@unknown.com", subject: "This is a warning", body: "You should keep quiet about this." }
    ]
  };

  const emails = emailData[laptopName] || [{ sender: "Unknown", subject: "No emails found", body: "No records available." }];

  // Create email modal
  let modal = document.createElement("div");
  modal.id = "email-modal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>📧 Emails from ${laptopName}</h2>
      <div class="email-list">
        ${emails.map(email => `
          <div class="email-item">
            <strong>From:</strong> ${email.sender} <br>
            <strong>Subject:</strong> ${email.subject} <br>
            <p>${email.body}</p>
          </div>
        `).join('')}
      </div>
      <button id="close-email-modal">Close</button>
    </div>
  `;

  // Append to body
  document.body.appendChild(modal);

  // Close modal event
  document.getElementById("close-email-modal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}

/**
 * 🎥 Move detective in front of CCTV when clicking CCTV footage
 */
function moveDetectiveToCCTV() {
  if (!scene || !cctvScreen || !character) return;

  // Define a position in front of the CCTV screen
  let newPosition = new THREE.Vector3(
    cctvScreen.position.x - 2, // Slightly in front of the screen
    character.position.y, // Maintain height
    cctvScreen.position.z
  );

  // Move detective character
  character.position.copy(newPosition);
  character.rotation.y = Math.PI / 2; // Face the screen
}

/**
 * 📊 Open a Timesheet Modal for Login/Logout Records
 */
function openLoginLogoutTimesheet() {
  // Create timesheet overlay
  let modal = document.createElement("div");
  modal.id = "timesheet-modal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>📊 Employee Login/Logout Times</h2>
      <table>
        <tr><th>Employee</th><th>Login Time</th><th>Logout Time</th></tr>
        <tr><td>Alex Johnson</td><td>08:45 AM</td><td>06:15 PM</td></tr>
        <tr><td>Sarah Miller</td><td>09:00 AM</td><td>05:30 PM</td></tr>
        <tr><td>Michael Lee</td><td>10:15 AM</td><td>04:45 PM</td></tr>
        <tr><td>Unknown User</td><td>11:05 AM</td><td>02:30 PM</td></tr>
      </table>
      <button id="close-modal">Close</button>
    </div>
  `;

  // Append to body
  document.body.appendChild(modal);

  // Close modal event
  document.getElementById("close-modal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}

/**
 * 📌 Function to collect evidence and update UI
 */
export function collectEvidence(evidenceName) {
  if (!collectedEvidence.includes(evidenceName)) {
    collectedEvidence.push(evidenceName);
    alert(`🕵️ Evidence Collected: ${evidenceName}`);
    console.log(`✅ Evidence Collected: ${evidenceName}`);
    updateEvidenceList(); // ✅ Update the UI to reflect new evidence
  } else {
    alert(`🕵️ You already collected this evidence.`);
  }
}

/**
 * 📌 Make Evidence Clickable in the 3D Scene
 */
window.addEventListener("click", (event) => {
  let mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Include all evidence objects + screens
  let intersects = raycaster.intersectObjects([...evidenceObjects, screenMesh, cctvScreen]);

  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;
    let evidenceName = clickedObject.name || "Unknown Evidence";

    // ✅ Check if clicked object is the CCTV Screen or Login/Logout Records
    if (clickedObject === cctvScreen) {
      evidenceName = "CCTV Footage";
    } else if (clickedObject === screenMesh) {
      evidenceName = "Login/Logout Records";
    }

    collectEvidence(evidenceName);
  }
});
