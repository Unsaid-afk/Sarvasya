const fs = require('fs');

const path = 'C:/Users/aarya/Desktop/work/accessibility yi/Asset-Manager/Asset-Manager/artifacts/sugamya-setu/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const helplines = `const HELPLINE_DIRECTORY = [
  { name: "Police Emergency", number: "112 / 100", authority: "Local Police", tags: "emergency, safety, police" },
  { name: "Ambulance & Medical", number: "102 / 108", authority: "State Health Dept", tags: "medical, hospital, ambulance" },
  { name: "Mental Health Helpline (KIRAN)", number: "1800-599-0019", authority: "Min. of Social Justice", tags: "mental health, counseling, aid" },
  { name: "National Disability Helpline", number: "011-23386128", authority: "Dept of Empowerment of PwD", tags: "disability, query, guidance" },
  { name: "Senior Citizens National Helpline", number: "14567", authority: "Min. of Social Justice", tags: "elderly, senior citizens, vrudhashram" },
  { name: "Women Helpline", number: "1091", authority: "National Commission for Women", tags: "women, emergency, safety" },
];`;

if (!content.includes('HELPLINE_DIRECTORY')) {
  content = content.replace(
    /function BrandMark\(\)/,
    helplines + '\n\nfunction BrandMark()'
  );
}

content = content.replace(
  /calculateRating\(b, complaints\)/g,
  `(b.rating || 0)`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed HELPLINE_DIRECTORY');
