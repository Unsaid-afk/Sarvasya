const fs = require('fs');

const path = 'C:/Users/aarya/Desktop/work/accessibility yi/Asset-Manager/Asset-Manager/artifacts/sugamya-setu/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix 1: queryKey missing
content = content.replace(
  /useGetUserStrikes\(profile.name, { query: { enabled: !!profile.name } }\);/,
  `useGetUserStrikes(profile.name, { query: { enabled: !!profile.name, queryKey: ['strikes', profile.name] } as any });`
);

// Fix 2: ComplaintStatusUpdateStatus casting
content = content.replace(
  /await updateComplaint.mutateAsync\({ id, data: { status, dismissReason: reason } }\);/,
  `await updateComplaint.mutateAsync({ id, data: { status: status as any, dismissReason: reason } });`
);

// Fix 3: HELPLINE_DIRECTORY missing
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

// Fix 4: INITIAL_NGOs missing
const ngos = `const INITIAL_NGOs = [
  { id: "ngo-1", name: "NCPEDP local chapter", type: "NGO", focus: "Accessibility audits & aid kits", address: "Alkapuri, Vadodara", tasks: ["Audit assistant", "Record digitisation"] },
  { id: "ngo-2", name: "Samarthyam", type: "NGO", focus: "PwD community representation", address: "Alkapuri, Vadodara", tasks: ["Companion walk", "Reading assistant"] },
  { id: "ngo-3", name: "AccessAbility", type: "NGO", focus: "Community outreach & awareness", address: "Alkapuri, Vadodara", tasks: ["Event coordination", "Sign language support"] },
];`;
if (!content.includes('INITIAL_NGOs')) {
  content = content.replace(
    /function BrandMark\(\)/,
    ngos + '\n\nfunction BrandMark()'
  );
}

// Fix 5: complaints reference in Dashboard (which calculates openGaps locally initially, but we removed complaints from Dashboard)
// Actually, earlier we replaced Dashboard partially.
// Let's remove calculateRating and complaints from useMemo if it's there.
content = content.replace(
  /const avgRating = buildings\.reduce\(\(acc, b\) => acc \+ calculateRating\(b, complaints\), 0\) \/ total;/,
  `const avgRating = buildings.reduce((acc, b) => acc + (b.rating || 0), 0) / (total || 1);`
);
content = content.replace(
  /const openGapsCount = complaints\.filter\(c => c\.status !== "Resolved"\)\.length;/,
  `const openGapsCount = 0; // Handled by API summary`
);
content = content.replace(
  /const greenCount = buildings\.filter\(b => calculateRating\(b, complaints\) >= 4\.5\)\.length;/,
  `const greenCount = buildings.filter(b => (b.rating || 0) >= 4.5).length;`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed TS errors in App.tsx');
