const fs = require('fs');
const path = require('path');

const htmlPath = path.join('c:', 'Users', 'aarya', 'Desktop', 'work', 'accessibility yi', 'Sarvasya_White_Paper.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// The CSS already exists. We just need to build the correct body.
// The user wants the logo up too. Let's use the sarvasya_icon.jpg since that might be the intended logo.
const logoHtml = `<img src="file:///c:/Users/aarya/Desktop/work/accessibility%20yi/sarvasya_icon.jpg" alt="Sarvasya Logo" style="width: 64px; height: 42px; object-fit: contain;">`;

// We also need the diagrams.
const diagramsHtml = `
<div class="diagrams-row">
  <div class="diagram">
    <div class="diagram-title">How Sarvasya Works</div>
    <div class="flow">
      <div class="flow-box bg-slate">Pre-Build<br>Check</div>
      <div class="flow-arrow">→</div>
      <div class="flow-box bg-ochre">Smart<br>Audit</div>
      <div class="flow-arrow">→</div>
      <div class="flow-box bg-teal">Actionable<br>Report</div>
      <div class="flow-arrow">→</div>
      <div class="flow-box bg-moss">Certified<br>Accessible</div>
    </div>
  </div>

  <div class="diagram">
    <div class="diagram-title">Expected Impact (Sample Metrics)</div>
    <div class="cost-bar">
      <div class="label">Compliance</div>
      <div class="bar bg-moss" style="width: 100%;"></div>
      <div class="amount">100%</div>
    </div>
    <div class="cost-bar">
      <div class="label">Retrofit Costs</div>
      <div class="bar bg-teal" style="width: 20%;"></div>
      <div class="amount">-80%</div>
    </div>
    <div class="cost-bar">
      <div class="label">Audit Time</div>
      <div class="bar bg-ochre" style="width: 50%;"></div>
      <div class="amount">-50%</div>
    </div>
    <div class="cost-bar">
      <div class="label">User Tracking</div>
      <div class="bar bg-slate" style="width: 100%;"></div>
      <div class="amount">Real-time</div>
    </div>
  </div>
</div>
`;

// Build the body
const newBody = `
<body>
<div class="header">
  ${logoHtml}
  <div class="header-text">
    <h1>From Audit to Action</h1>
    <div class="subtitle">Track: Accessibility | Team: codeblooded</div>
  </div>
</div>

<div class="two-col">
  <div class="col">
    <h2>Problem Summary</h2>
    <p>India's accessibility reporting tools only function post-construction, making fixes difficult and expensive. Reports lack specifications for builders, citizens receive no resolution updates, and there's no pre-construction blueprint accessibility check.</p>
  </div>
  <div class="col">
    <h2>Solution Summary</h2>
    <p>Sarvasya is an open-source web platform ensuring public buildings meet accessibility standards before construction. It features a public directory for transparency, an automated blueprint checker for architects, standardized field audits mapping to government guidelines, and accessible indoor navigation for users.</p>
  </div>
</div>

${diagramsHtml}

<div class="two-col">
  <div class="col">
    <h2>Solution Type</h2>
    <p>☑ Product &nbsp;&nbsp; ☑ Technology &nbsp;&nbsp; ☐ Service<br>☐ Hardware &nbsp;&nbsp; ☑ Platform</p>
    
    <h2>Target Ministry/Department</h2>
    <p>Ministry of Social Justice and Empowerment (DEPwD)</p>
  </div>
  <div class="col">
    <h2>Expected Impact</h2>
    <p>Prevents costly post-construction retrofits by catching barriers early, standardizes compliance across municipalities, and empowers citizens to independently navigate public spaces.</p>
  </div>
</div>

<h2>Policy Recommendation</h2>
<p>We recommend that the Ministry of Social Justice and Empowerment mandate pre-construction accessibility compliance checks using standardized digital platforms under the Rights of Persons with Disabilities (RPwD) Act, 2016, to ensure all public buildings are certified accessible before construction begins.</p>

<h2>Key Evidence</h2>
<p>According to the World Bank, retrofitting an inaccessible building can cost up to 20% of the original construction cost, whereas designing for accessibility from the start adds less than 1% to the budget.</p>

<div class="footer">
  Codeblooded | Accessibility Track
</div>
</body>
`;

// We will keep the CSS from the original HTML but replace the body.
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const css = cssMatch ? cssMatch[1] : '';

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Sarvasya White Paper</title>
<style>${css}</style>
</head>
${newBody}
</html>`;

fs.writeFileSync(htmlPath, fullHtml);
console.log('HTML updated successfully with diagrams and logo');
