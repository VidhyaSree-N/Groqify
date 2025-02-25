import * as THREE from '../js/libs/three.module.js';
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
    // moveDetectiveToCCTV();
    openCCTVVideo();
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
      { sender: "hr@company.com", subject: "Policy Reminder", body: "Reminder about workplace harassment policies." ,time: "4:50 PM"},
      // { sender: "team@company.com", subject: "Meeting Follow-up", body: "Minutes from last team meeting." ,time: "9:50 AM"},
      { sender: "anonymous@unknown.com", subject: "🚨 Threat Draft", body: "This is a draft email threatening someone.",time: "8:50 PM", highlight: true }
    ],
    "Emily's Laptop": [
      { sender: "news@dailyupdates.com", subject: "Newsletter", body: "Latest news articles for today.",time: "11:40 AM" },
      // { sender: "company@admin.com", subject: "System Update", body: "Your system was updated successfully.",time: "6:30 PM" },
      { sender: "anonymous@unknown.com", subject: "🚨 Suspicious Browser History", body: "User accessed multiple sites related to anonymous emails.",time: "7:00 PM", highlight: true }
    ],
    "Bill's Laptop": [
      { sender: "it@company.com", subject: "Password Change", body: "Your password was changed successfully.",time: "9:20 AM" },
      // { sender: "finance@company.com", subject: "Monthly Report", body: "Your financial report is ready for review.",time: "4:20 PM" },
      { sender: "anonymous@unknown.com", subject: "🚨 Anonymous Mail", body: "Threatening email sent",time: "8:35 PM", highlight: true }
    ]
  };

  const learningNotes = {
    "Alex's Laptop": `
  <div class="learning-note">
    <strong>💡 Learning Note:</strong> Workplace harassment extends beyond physical behavior.
    <strong>Threatening emails</strong> or drafts, even if unsent, create a hostile environment and violate workplace policies.
    <strong>Always report</strong> if you find such drafts or emails.
  </div>`,

    "Emily's Laptop": `
  <div class="learning-note">
    <strong>💡 Learning Note:</strong> <strong>Cybersecurity policies prohibit anonymous emails for threats.</strong>
    Deleting emails doesn't mean they are gone—<strong>company IT logs retain email activities.</strong>
    Employees accessing suspicious sites may be <strong>attempting to erase digital footprints.</strong>
  </div>`,

    "Bill's Laptop": `
  <div class="learning-note">
    <strong>💡 Learning Note:</strong> Unauthorized access to an employee’s laptop is a security violation.
    If a <strong>threatening email was sent while the employee was away,</strong> it could indicate:
    <ul>
      <li><strong>Compromised login credentials</strong></li>
      <li><strong>Insider attack from a coworker</strong></li>
      <li><strong>Failure to lock a system</strong> before leaving the workstation.</li>
    </ul>
  </div>`,
  };

  const emails = emailData[laptopName] || [{ sender: "Unknown", subject: "No emails found", body: "No records available." }];

  // Create email modal
  let modal = document.createElement("div");
  modal.id = "email-modal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>📧 Emails from ${laptopName}</h2>
      <div class="learning-note">${learningNotes[laptopName] || ""}</div>
      <div class="email-list">
        ${emails.map(email => `
          <div class="email-item" style="${email.highlight ? 'background-color: rgba(255, 0, 0, 0.2); color: darkred; font-weight: bold; border-left: 5px solid red; padding: 5px;' : ''}">
            <strong>📅 Time:</strong> ${email.time} <br>
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
      <div class="learning-note">
    <strong>💡 Learning Note:</strong> <strong>Accurate login/logout records</strong> help verify presence during an incident.
    In cases of security breaches, incorrect logouts could suggest <strong>an attempt to cover tracks.</strong>
    Always <strong>log in with your own credentials</strong> and ensure proper logout to maintain system integrity.
  </div>
      <table>
        <tr><th>Employee</th><th>Login Time</th><th>Logout Time</th></tr>
        <tr><td>Alex </td><td>08:45 AM</td><td>06:15 PM</td></tr>
        <tr><td>Amy</td><td>09:00 AM</td><td>05:30 PM</td></tr>
        <tr><td>Bill</td><td>10:15 AM</td><td>09:45 PM</td></tr>
        <tr><td>Emily</td><td>11:05 AM</td><td>9:30 PM</td></tr>
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
function openCCTVVideo() {
  // Remove any existing modal before adding a new one
  let existingModal = document.getElementById("cctv-modal");
  if (existingModal) {
    document.body.removeChild(existingModal);
  }

  // Create video modal with full black background
  let modal = document.createElement("div");
  modal.id = "cctv-modal";
  modal.className = "cctv-overlay";
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: black;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
  `;

  modal.innerHTML = `
    <div class="learning-note" style="color: white; background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center;">
        <strong>💡 Learning Note:</strong>
        <br>Failing to lock your computer when leaving your desk can result in unauthorized access.
        <br><strong>CCTV helps in investigating workplace incidents, but prevention is key.</strong>
        <br>Always <strong>lock your system</strong> and avoid sharing passwords to prevent security breaches.
      </div>

    <div class="cctv-modal-content" style="width: 80%; max-width: 900px; text-align: center;">
      <video id="cctv-video" autoplay controls style="width: 100%; border: 2px solid white;">
        <source src="/cctv.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>

      <button id="close-cctv-modal" style=" background: red;
        color: white; border: none; cursor: pointer;
      ">Close</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Auto-play the video when modal opens
  let video = document.getElementById("cctv-video");
  video.play();

  // Close modal when clicking the "Close" button
  document.getElementById("close-cctv-modal").addEventListener("click", closeCCTVVideo);
}

function closeCCTVVideo() {
  let modal = document.getElementById("cctv-modal");
  if (modal) {
    let video = document.getElementById("cctv-video");
    if (video) video.pause(); // Stop the video when closing
    document.body.removeChild(modal);
  }
}
