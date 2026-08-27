const fs = require('fs');
const path = require('path');

const htmlPath = path.join('c:', 'Users', 'aarya', 'Desktop', 'work', 'accessibility yi', 'Sarvasya_White_Paper.html');

const premiumCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;700;800&display=swap');
  
  :root {
    --primary: #2563eb;
    --primary-light: #3b82f6;
    --secondary: #0f172a;
    --accent: #f59e0b;
    --bg-color: #f8fafc;
    --card-bg: #ffffff;
    --text-main: #334155;
    --text-muted: #64748b;
    --border: #e2e8f0;
  }

  @page { size: A4; margin: 10mm; }
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', sans-serif;
    font-size: 11.5px;
    color: var(--text-main);
    background: var(--bg-color);
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 15px 25px;
    max-width: 210mm;
    max-height: 297mm;
    margin: 0 auto;
    background-color: white;
    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    overflow: hidden; /* Ensure no scroll on print/pdf */
  }

  /* Header Section */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, var(--secondary) 0%, #1e293b 100%);
    border-radius: 12px;
    color: white;
    margin-bottom: 16px;
    box-shadow: 0 4px 10px -3px rgba(15, 23, 42, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  .header::before {
    content: '';
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.3), transparent 50%);
    pointer-events: none;
  }

  .header img {
    width: 60px;
    height: auto;
    max-height: 40px;
    object-fit: contain;
    background: white;
    padding: 6px;
    border-radius: 8px;
    z-index: 1;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .header-text {
    text-align: right;
    z-index: 1;
  }

  .header-text h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
    font-weight: 800;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
    color: #f8fafc;
  }

  .header-text .subtitle {
    font-size: 11px;
    color: #cbd5e1;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    display: inline-block;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 10px;
    border-radius: 16px;
    backdrop-filter: blur(4px);
  }

  /* Grid Layout */
  .grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  /* Cards */
  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  }

  .card.full-width {
    grid-column: 1 / -1;
  }

  h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--secondary);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  h2::before {
    content: '';
    display: block;
    width: 3px;
    height: 12px;
    background: var(--primary);
    border-radius: 2px;
  }

  p { margin-bottom: 6px; text-align: justify; }
  p:last-child { margin-bottom: 0; }

  /* Diagrams */
  .diagram-container {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }

  .flow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
  }

  .flow-box {
    flex: 1;
    text-align: center;
    padding: 8px 4px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    color: white;
    line-height: 1.2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .flow-box:nth-child(1) { background: linear-gradient(135deg, #64748b, #475569); }
  .flow-box:nth-child(3) { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .flow-box:nth-child(5) { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
  .flow-box:nth-child(7) { background: linear-gradient(135deg, #10b981, #059669); }

  .flow-arrow {
    color: var(--text-muted);
    font-weight: 800;
    margin: 0 4px;
    font-size: 14px;
  }

  /* Cost Bars */
  .cost-bar-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
  }

  .cost-bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cost-bar .label {
    width: 75px;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-main);
  }

  .cost-bar .bar-container {
    flex: 1;
    background: #f1f5f9;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
  }

  .cost-bar .bar {
    height: 100%;
    border-radius: 3px;
  }
  
  .cost-bar:nth-child(1) .bar { background: linear-gradient(90deg, #10b981, #34d399); width: 100%; }
  .cost-bar:nth-child(2) .bar { background: linear-gradient(90deg, #3b82f6, #60a5fa); width: 20%; }
  .cost-bar:nth-child(3) .bar { background: linear-gradient(90deg, #f59e0b, #fbbf24); width: 50%; }

  .cost-bar .amount {
    width: 30px;
    text-align: right;
    font-size: 10px;
    font-weight: 700;
    color: var(--secondary);
  }

  /* Tags */
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  
  .tag {
    background: #eff6ff;
    color: var(--primary);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    border: 1px solid #bfdbfe;
  }

  .footer {
    text-align: center;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 500;
  }
`;

const premiumHtml = \`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sarvasya White Paper</title>
<style>\${premiumCss}</style>
</head>
<body>

<div class="header">
  <img src="file:///c:/Users/aarya/Desktop/work/accessibility%20yi/sarvasya_icon.jpg" alt="Sarvasya Logo">
  <div class="header-text">
    <h1>From Audit to Action</h1>
    <div class="subtitle">Track: Accessibility &nbsp;|&nbsp; Team: codeblooded</div>
  </div>
</div>

<div class="grid-container">
  
  <div class="card">
    <h2>Problem Summary</h2>
    <p>India's accessibility reporting tools only function post-construction, making fixes difficult and expensive. Reports lack specifications for builders, citizens receive no resolution updates, and there's no pre-construction blueprint accessibility check.</p>
  </div>

  <div class="card">
    <h2>Solution Summary</h2>
    <p>Sarvasya is an open-source web platform ensuring public buildings meet accessibility standards before construction. It features a public directory for transparency, an automated blueprint checker for architects, standardized field audits mapping to government guidelines, and accessible indoor navigation for users.</p>
  </div>

  <div class="card full-width">
    <h2>How Sarvasya Works</h2>
    <div class="flow">
      <div class="flow-box">1. Pre-Build<br>Check</div>
      <div class="flow-arrow">→</div>
      <div class="flow-box">2. Smart<br>Audit</div>
      <div class="flow-arrow">→</div>
      <div class="flow-box">3. Actionable<br>Report</div>
      <div class="flow-arrow">→</div>
      <div class="flow-box">4. Certified<br>Accessible</div>
    </div>
  </div>

  <div class="card">
    <h2>Solution Type</h2>
    <div class="tags">
      <div class="tag">✓ Product</div>
      <div class="tag">✓ Technology</div>
      <div class="tag">✓ Platform</div>
    </div>
    
    <h2 style="margin-top: 16px;">Target Ministry/Department</h2>
    <p style="font-weight: 500; color: #1e293b;">Ministry of Social Justice and Empowerment (DEPwD)</p>
  </div>

  <div class="card">
    <h2>Expected Impact</h2>
    <p>Prevents costly post-construction retrofits by catching barriers early, standardizes compliance across municipalities, and empowers citizens to independently navigate public spaces.</p>
    
    <div class="diagram-container">
      <div class="cost-bar-wrapper">
        <div class="cost-bar">
          <div class="label">Compliance</div>
          <div class="bar-container"><div class="bar"></div></div>
          <div class="amount">100%</div>
        </div>
        <div class="cost-bar">
          <div class="label">Retrofit Costs</div>
          <div class="bar-container"><div class="bar"></div></div>
          <div class="amount">-80%</div>
        </div>
        <div class="cost-bar">
          <div class="label">Audit Time</div>
          <div class="bar-container"><div class="bar"></div></div>
          <div class="amount">-50%</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card full-width">
    <h2>Policy Recommendation</h2>
    <p>We recommend that the Ministry of Social Justice and Empowerment mandate pre-construction accessibility compliance checks using standardized digital platforms under the Rights of Persons with Disabilities (RPwD) Act, 2016, to ensure all public buildings are certified accessible before construction begins.</p>
  </div>

  <div class="card full-width" style="background: #eff6ff; border-color: #bfdbfe;">
    <h2>Key Evidence</h2>
    <p style="color: #1e3a8a; font-style: italic;">"According to the World Bank, retrofitting an inaccessible building can cost up to 20% of the original construction cost, whereas designing for accessibility from the start adds less than 1% to the budget."</p>
  </div>

</div>

<div class="footer">
  &copy; 2026 Sarvasya Initiative &nbsp;|&nbsp; Codeblooded &nbsp;|&nbsp; Accessibility Track
</div>

</body>
</html>\`;

fs.writeFileSync(htmlPath, premiumHtml);
console.log('Premium 1-page HTML created successfully.');
