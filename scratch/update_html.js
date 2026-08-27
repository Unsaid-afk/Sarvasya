const fs = require('fs');
const path = require('path');

const htmlPath = path.join('c:', 'Users', 'aarya', 'Desktop', 'work', 'accessibility yi', 'Sarvasya_White_Paper.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const newContent = `
<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th, td {
    border: 1px solid #d6d3d1;
    padding: 12px;
    text-align: left;
  }
  th {
    background-color: #1e3a8a;
    color: white;
    font-weight: 600;
  }
  td:first-child {
    font-weight: 600;
    width: 25%;
  }
</style>
<table>
  <thead>
    <tr>
      <th>Field</th>
      <th>Instruction / Response</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Track</td>
      <td>Accessibility</td>
    </tr>
    <tr>
      <td>Problem Statement</td>
      <td>Sarvasya — Bridging the Accessibility Gap</td>
    </tr>
    <tr>
      <td>Team Details</td>
      <td>codeblooded</td>
    </tr>
    <tr>
      <td>Problem Summary</td>
      <td>India's accessibility reporting tools only function post-construction, making fixes difficult and expensive. Reports lack specifications for builders, citizens receive no resolution updates, and there's no pre-construction blueprint accessibility check.</td>
    </tr>
    <tr>
      <td>Solution Summary</td>
      <td>Sarvasya is an open-source web platform ensuring public buildings meet accessibility standards before construction. It features a public directory for transparency, an automated blueprint checker for architects, standardized field audits mapping to government guidelines, and accessible indoor navigation for users.</td>
    </tr>
    <tr>
      <td>Solution Type</td>
      <td>☑ Product / ☑ Technology / ☐ Service / ☐ Hardware / ☑ Platform</td>
    </tr>
    <tr>
      <td>Policy Recommendation</td>
      <td>We recommend that the Ministry of Social Justice and Empowerment mandate pre-construction accessibility compliance checks using standardized digital platforms under the Rights of Persons with Disabilities (RPwD) Act, 2016, to ensure all public buildings are certified accessible before construction begins.</td>
    </tr>
    <tr>
      <td>Target Ministry/Department</td>
      <td>Ministry of Social Justice and Empowerment (DEPwD)</td>
    </tr>
    <tr>
      <td>Expected Impact</td>
      <td>Prevents costly post-construction retrofits by catching barriers early, standardizes compliance across municipalities, and empowers citizens to independently navigate public spaces.</td>
    </tr>
    <tr>
      <td>Key Evidence</td>
      <td>According to the World Bank, retrofitting an inaccessible building can cost up to 20% of the original construction cost, whereas designing for accessibility from the start adds less than 1% to the budget.</td>
    </tr>
  </tbody>
</table>
`;

// Extract header
const headerMatch = html.match(/<div class="header">[\s\S]*?<\/div>/);
const header = headerMatch ? headerMatch[0] : '';

// Replace body content
const bodyRegex = /(<body>)([\s\S]*?)(<\/body>)/;
html = html.replace(bodyRegex, "$1\\n" + header + "\\n" + newContent + "\\n$3");

fs.writeFileSync(htmlPath, html);
console.log('HTML updated successfully');
