const complianceRules = {
  harassment: `
    <strong>What is Workplace Harassment?</strong><br><br>
    Harassment is any unwelcome conduct that creates an intimidating, hostile, or offensive work environment.<br><br>
    <strong>Examples:</strong>
    <ul>
      <li>Unwanted verbal, physical, or visual behaviors.</li>
      <li>Sexual, discriminatory, or retaliatory actions.</li>
      <li>Affects the victim's ability to perform their job.</li>
    </ul>
  `,

  types_harassment: `
    <strong>Types of Workplace Harassment:</strong><br><br>
    <ul>
      <li><strong>Sexual Harassment:</strong> Unwanted advances, inappropriate jokes, coercion.</li>
      <li><strong>Discriminatory Harassment:</strong> Based on race, gender, religion, disability.</li>
      <li><strong>Retaliation Harassment:</strong> Punishing employees for reporting issues.</li>
      <li><strong>Bullying:</strong> Intimidation, humiliation, repeated verbal abuse.</li>
    </ul>
  `,

  reporting: `
    <strong>Steps to Report Harassment:</strong><br><br>
    <ol>
      <li><strong>Document everything:</strong> Save emails, messages, witness statements.</li>
      <li><strong>Report to HR or Supervisor:</strong> Follow company procedures.</li>
      <li><strong>File a Formal Complaint:</strong> If unresolved, escalate within the company.</li>
      <li><strong>Seek Legal Help:</strong> If necessary, report to external authorities.</li>
    </ol>
  `,

  company_policy: `
    <strong>Company Policies & Employee Rights:</strong><br><br>
    <ul>
      <li>All employees have the right to a safe workplace.</li>
      <li>Retaliation against employees who report harassment is prohibited.</li>
      <li>Complaints must be investigated fairly and promptly.</li>
      <li>Companies must provide harassment prevention training.</li>
    </ul>
  `,

  bystander_intervention: `
    <strong>How to Intervene as a Bystander:</strong><br><br>
    <ul>
      <li><strong>Direct Action:</strong> Speak up if you witness harassment.</li>
      <li><strong>Delegate:</strong> Report to HR or a manager.</li>
      <li><strong>Distract:</strong> Change the subject or disrupt the situation.</li>
      <li><strong>Document:</strong> If safe, record incidents to support victims.</li>
    </ul>
  `
};

// Open Guidebook Modal and Show Default Topic
document.getElementById("open-guidebook").addEventListener("click", () => {
  document.getElementById("guidebook-modal").style.display = "flex";

  // Set default selected topic to "harassment"
  document.getElementById("guidebook-topic").value = "harassment";

  // Display the default topic content
  document.getElementById("guidebook-content").innerHTML = complianceRules["harassment"];
});

// Close Guidebook Modal
document.getElementById("close-guidebook").addEventListener("click", () => {
  document.getElementById("guidebook-modal").style.display = "none";
});

// Update Guidebook Content When Selecting a Topic
document.getElementById("guidebook-topic").addEventListener("change", (event) => {
  let selectedTopic = event.target.value;
  document.getElementById("guidebook-content").innerHTML = complianceRules[selectedTopic];
});
