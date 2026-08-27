const fs = require('fs');
const path = require('path');

const mdPath = path.join('c:', 'Users', 'aarya', 'Desktop', 'work', 'accessibility yi', 'Sarvasya_White_Paper.md');
const htmlPath = path.join('c:', 'Users', 'aarya', 'Desktop', 'work', 'accessibility yi', 'Sarvasya_White_Paper.html');

// 1. Update Markdown File
const mdContent = `<img class="logo" src="file:///c:/Users/aarya/Desktop/work/accessibility yi/sarvasya_icon.jpg" alt="Sarvasya Logo">

# From Audit to Action
**Track:** Accessibility | **Team:** codeblooded

## Problem Summary
India's accessibility reporting tools only function post-construction, making fixes difficult and expensive. Reports lack specifications for builders, citizens receive no resolution updates, and there is no pre-construction blueprint accessibility check.

## Solution Summary
Sarvasya is an open-source web platform ensuring public buildings meet accessibility standards before construction. It features a public directory for transparency, an automated blueprint checker for architects, standardized field audits mapping to government guidelines, and accessible indoor navigation for users.

## Solution Type
Product / Technology / Platform

## Policy Recommendation
We recommend that the Ministry of Social Justice and Empowerment mandate pre-construction accessibility compliance checks using standardized digital platforms under the Rights of Persons with Disabilities (RPwD) Act, 2016, to ensure all public buildings are certified accessible before construction begins.

## Target Ministry/Department
Ministry of Social Justice and Empowerment (DEPwD)

## Expected Impact
Prevents costly post-construction retrofits by catching barriers early, standardizes compliance across municipalities, and empowers citizens to independently navigate public spaces.

## Key Evidence
According to the World Bank, retrofitting an inaccessible building can cost up to 20% of the original construction cost, whereas designing for accessibility from the start adds less than 1% to the budget.
`;

fs.writeFileSync(mdPath, mdContent);

// 2. Update HTML File
let html = fs.readFileSync(htmlPath, 'utf8');

// We need to find the header image, then rebuild the body.
const headerMatch = html.match(/<div class="header">([\s\S]*?)<\/div>/);
let headerImg = '';
if (headerMatch && headerMatch[1].includes('<img')) {
    headerImg = headerMatch[1].trim();
} else {
    // try to extract just the img tag if it's there
    const imgMatch = html.match(/<img[^>]*src="data:image[^>]*>/);
    if (imgMatch) {
        headerImg = imgMatch[0];
    }
}

// Ensure we have the base css styles
let css = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
  @page { size: A4; margin: 14mm 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Manrope', 'Segoe UI', sans-serif;
    font-size: 14px; color: #292524; background: #FAFAF9;
    line-height: 1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #CA8A04; padding-bottom: 10px; margin-bottom: 16px; }
  .header img { width: 64px; height: 42px; object-fit: contain; }
  .header-text h1 { font-size: 22px; font-weight: 800; color: #4D7C0F; line-height: 1.2; }
  .header-text .subtitle { font-size: 12px; color: #78716C; font-weight: 600; letter-spacing: 0.5px; }
  .two-col { display: flex; gap: 20px; margin-bottom: 14px; }
  .col { flex: 1; }
  h2 { font-size: 15px; font-weight: 700; color: #4D7C0F; border-left: 3px solid #CA8A04; padding-left: 8px; margin-bottom: 8px; margin-top: 14px; }
  p { margin-bottom: 8px; }
  ul { padding-left: 18px; margin-bottom: 8px; }
  li { margin-bottom: 4px; }
  strong { color: #4D7C0F; font-weight: 700; }
`;

const newBody = `
<body>
<div class="header">
  ${headerImg}
  <div class="header-text">
    <h1>From Audit to Action</h1>
    <div class="subtitle">Track: Accessibility | Team: codeblooded</div>
  </div>
</div>

<h2>Problem Summary</h2>
<p>India's accessibility reporting tools only function post-construction, making fixes difficult and expensive. Reports lack specifications for builders, citizens receive no resolution updates, and there's no pre-construction blueprint accessibility check.</p>

<h2>Solution Summary</h2>
<p>Sarvasya is an open-source web platform ensuring public buildings meet accessibility standards before construction. It features a public directory for transparency, an automated blueprint checker for architects, standardized field audits mapping to government guidelines, and accessible indoor navigation for users.</p>

<div class="two-col">
  <div class="col">
    <h2>Solution Type</h2>
    <p>☑ Product &nbsp; ☑ Technology &nbsp; ☑ Platform</p>
    
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
</body>
`;

// Replace everything inside the html tags
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
console.log('Markdown and HTML updated successfully');
