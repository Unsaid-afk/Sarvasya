import fs from "fs";
import path from "path";
import { type BuildingRecord } from "../routes/buildings";
import type { Complaint, Ngo, VolunteerBooking, SafeSpot } from "@workspace/api-zod";

// Use process.cwd() for reliable path resolution in both ESM and CJS bundles
const DB_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DB_DIR, "db.json");

const initialBuildings: BuildingRecord[] = [
  {
    id: "ssg-hospital",
    name: "Sir Sayajirao General (SSG) Hospital",
    address: "Jail Road, Anandpura, Vadodara, Gujarat 390001",
    builder: "Dept of Health & Family Welfare, Govt of Gujarat",
    rating: 4.8,
    status: "green",
    lastAudit: "10 Aug 2026",
    accessibleFeatures: [
      "Graded 1:12 Ramp with Anti-Slip Flooring",
      "Continuous Yellow Tactile Guiding Path",
      "Braille & Voice-Enabled Elevator Bank",
      "NBC 2016 Compliant Wheelchair Restrooms",
      "24/7 Red-Flashing Panic Alarms in Washrooms",
      "Dedicated Wheelchair Helpdesk at Casualty"
    ],
    coordinates: { lat: 22.3072, lng: 73.1812 },
    auditor: "National Access Audit Association",
    category: "hospital",
    report: {
      score: 98,
      rating: 4.8,
      summary: "Full NBC 2016 & RPwD Act compliance. Main casualty entrance features a continuous guiding tactile pathway directly to OPD registration and elevator lobby.",
      checkedAt: "10 Aug 2026",
      gaps: [],
    },
    audit: {
      id: "audit-ssg-01",
      auditorName: "National Access Audit Association",
      submittedAt: "10 Aug 2026",
      status: "verified",
      summary: "On-site field verification confirmed ramp slope (7.8%), grab rail heights (750mm), and clear turning radius of 1600mm in all public restrooms.",
    },
    wayfinding: [
      { id: "entrance", label: "Casualty Main Ramp", type: "ramp", status: "open", x: 20, y: 80, note: "Graded 1:12 slope with dual handrails at 750mm and 900mm." },
      { id: "lift", label: "Central OPD Lift Bank", type: "lift", status: "open", x: 50, y: 40, note: "Braille embossed buttons, auditory announcements in Gujarati, Hindi & English." },
      { id: "restroom", label: "Ground Floor Accessible Washroom", type: "restroom", status: "open", x: 80, y: 30, note: "1,600 mm wheelchair turning circle with outward swinging safety door." },
      { id: "help", label: "Accessible Suvidha Help Desk", type: "help", status: "open", x: 35, y: 65, note: "Free wheelchairs and dedicated attendants available at counter 1." },
    ],
  },
  {
    id: "vmc-headquarters",
    name: "Vadodara Municipal Corporation (VMC) HQ - Khanderao Market",
    address: "Khanderao Market Building, Rajmahal Road, Vadodara, Gujarat 390001",
    builder: "Vadodara Municipal Corporation",
    rating: 4.6,
    status: "green",
    lastAudit: "18 Jul 2026",
    accessibleFeatures: [
      "Heritage-adapted West Entrance Ramp",
      "High-Contrast Ground Tactile Paving",
      "Dual Lift Core with Braille Floor Indicators",
      "Citizen Seva Kendra Low-Height Counters",
      "Dedicated Accessible Parking Bays"
    ],
    coordinates: { lat: 22.2967, lng: 73.2036 },
    auditor: "AccessWorks India",
    category: "government",
    report: {
      score: 92,
      rating: 4.6,
      summary: "Historic heritage civic headquarters upgraded with modern accessibility infrastructure under the Sugamya Bharat Abhiyan.",
      checkedAt: "18 Jul 2026",
      gaps: [
        {
          id: "vmc-gap-1",
          title: "Signage Illumination Contrast",
          severity: "minor",
          reference: "NBC 2016 · 4.6.1",
          recommendation: "Mount high-contrast backlit Braille signage at the heritage North corridor.",
        },
      ],
    },
    audit: {
      id: "audit-vmc-hq-01",
      auditorName: "AccessWorks India",
      submittedAt: "18 Jul 2026",
      status: "verified",
      summary: "West ramp landing clearances and citizen counter heights (760mm) verified for independent wheelchair usability.",
    },
    wayfinding: [
      { id: "entrance", label: "West Gate Accessible Ramp", type: "ramp", status: "open", x: 15, y: 75, note: "Smooth granite pavers with anti-skid grooves." },
      { id: "lift", label: "Central Administration Elevator", type: "lift", status: "open", x: 48, y: 45, note: "Auditory chime and Braille floor directory." },
      { id: "restroom", label: "Civic Kendra Unisex Washroom", type: "restroom", status: "open", x: 78, y: 35, note: "Emergency call bell connected to security control." },
      { id: "help", label: "Jan Seva Assistance Counter", type: "help", status: "open", x: 30, y: 60, note: "Lowered counter (760mm) for wheelchair users." },
    ],
  },
  {
    id: "collector-office-kuber-bhavan",
    name: "Vadodara District Collectorate (Kuber Bhavan)",
    address: "Kuber Bhavan, Kothi Compound, Raopura, Vadodara, Gujarat 390001",
    builder: "Roads & Buildings Dept, Govt of Gujarat",
    rating: 4.7,
    status: "green",
    lastAudit: "02 Aug 2026",
    accessibleFeatures: [
      "Covered Weather-Proof Entrance Ramp",
      "Tactile Route from Gate to Block A & B",
      "Multi-Floor Accessible Lifts",
      "Revenue Department Low-Height Assistance Windows",
      "Accessible Parking Adjacent to Porch"
    ],
    coordinates: { lat: 22.3048, lng: 73.1971 },
    auditor: "State Accessibility Directorate",
    category: "government",
    report: {
      score: 95,
      rating: 4.7,
      summary: "High volume district administrative complex with fully barrier-free ground floor public counters and elevator access to all administrative branches.",
      checkedAt: "02 Aug 2026",
      gaps: [],
    },
    audit: {
      id: "audit-kuber-01",
      auditorName: "State Accessibility Directorate",
      submittedAt: "02 Aug 2026",
      status: "verified",
      summary: "Comprehensive audit of Block A, B & C completed. Automated sliding doors and unobstructed 1200mm corridors.",
    },
    wayfinding: [
      { id: "entrance", label: "Block A Main Porch Ramp", type: "ramp", status: "open", x: 22, y: 78, note: "Wide 1800mm ramp with tactile warning studs at both landings." },
      { id: "lift", label: "Block A Passenger Lift", type: "lift", status: "open", x: 52, y: 42, note: "Equipped with voice announcements and emergency battery backup." },
      { id: "restroom", label: "Ground Floor Block B Restroom", type: "restroom", status: "open", x: 82, y: 28, note: "Full compliance with grab bars and lever-operated taps." },
      { id: "help", label: "Collectorate Reception & Legal Aid", type: "help", status: "open", x: 38, y: 58, note: "Designated nodal officer for PwD welfare assistance." },
    ],
  },
  {
    id: "sayaji-baug-central-library",
    name: "Central Library Vadodara (Hansa Mehta Library / MS University)",
    address: "Sayaji Gunj, Near Railway Station, Vadodara, Gujarat 390002",
    builder: "The Maharaja Sayajirao University of Baroda",
    rating: 4.5,
    status: "green",
    lastAudit: "14 Jun 2026",
    accessibleFeatures: [
      "Ground Floor Accessible Reading Section",
      "Digital Screen Magnifiers & JAWS Screen Reader Systems",
      "Audiobook Repository & Braille Manuscript Section",
      "Wide Doorways (1050mm) throughout stacks",
      "Accessible Ramp at North Portico"
    ],
    coordinates: { lat: 22.3168, lng: 73.1895 },
    auditor: "Inclusive Universities Network",
    category: "library",
    report: {
      score: 91,
      rating: 4.5,
      summary: "Premier public and university research library with an exclusive assistive technology corner for visually impaired researchers and students.",
      checkedAt: "14 Jun 2026",
      gaps: [
        {
          id: "lib-gap-1",
          title: "Second Floor Mezzanine Access",
          severity: "moderate",
          reference: "RPwD Act · Section 41",
          recommendation: "Install stairlift or provide digitized remote request delivery for mezzanine rare archives.",
        },
      ],
    },
    audit: {
      id: "audit-hansa-01",
      auditorName: "Inclusive Universities Network",
      submittedAt: "14 Jun 2026",
      status: "verified",
      summary: "Assistive computing workstations tested and operational. Braille signage present at all aisle headers.",
    },
    wayfinding: [
      { id: "entrance", label: "North Portico Ramp", type: "ramp", status: "open", x: 18, y: 82, note: "Grade 1:12 ramp with canopy shelter." },
      { id: "lift", label: "Library Stacks Elevator", type: "lift", status: "open", x: 50, y: 48, note: "Access to ground, 1st and 2nd floor reading rooms." },
      { id: "restroom", label: "Reading Hall Restroom", type: "restroom", status: "open", x: 75, y: 32, note: "Grab bars, lowered basin, non-slip tile surface." },
      { id: "help", label: "Assistive Technology Helpdesk", type: "help", status: "open", x: 32, y: 62, note: "Screen readers, refreshable Braille displays, and human reading volunteers." },
    ],
  },
  {
    id: "vadodara-civic-centre-alkapuri",
    name: "Vadodara Civic Center & Ward 15 Office (Alkapuri)",
    address: "Opp. Alkapuri Post Office, RC Dutt Road, Vadodara, Gujarat 390007",
    builder: "Vadodara Municipal Corporation",
    rating: 3.9,
    status: "amber",
    lastAudit: "28 May 2026",
    accessibleFeatures: [
      "Main Entrance Ramp",
      "Passenger Elevator to Ward Council Floor",
      "Designated PwD Parking Bay",
      "Property Tax Payment Ground Counters"
    ],
    coordinates: { lat: 22.3119, lng: 73.1756 },
    auditor: "Inclusive Routes Collective",
    category: "government",
    report: {
      score: 76,
      rating: 3.9,
      summary: "The building provides good basic entry and lift circulation, but continuous tactile navigation and restroom turning radii require retrofitting.",
      checkedAt: "28 May 2026",
      gaps: [
        {
          id: "civic-gap-1",
          title: "Continuous Tactile Guiding Pathway Missing",
          severity: "critical",
          reference: "RPwD Act · Schedule 2",
          recommendation: "Lay continuous hazard and guiding tactile tiles from entrance gate to the main token desk.",
        },
        {
          id: "civic-gap-2",
          title: "Restroom Wheelchair Turning Radius Deficient",
          severity: "moderate",
          reference: "NBC 2016 · 4.5.4",
          recommendation: "Reconfigure inner partitioning to guarantee a 1,500 mm unobstructed circle.",
        },
      ],
    },
    audit: {
      id: "audit-pcc-01",
      auditorName: "Inclusive Routes Collective",
      submittedAt: "28 May 2026",
      status: "verified",
      summary: "Field audit confirmed elevator is operational. Remediation work order pending for tactile flooring.",
    },
    wayfinding: [
      { id: "entrance", label: "Main Porch Ramp", type: "ramp", status: "open", x: 20, y: 72, note: "Ramp is clear; threshold transition is 15mm." },
      { id: "lift", label: "Ward Office Elevator", type: "lift", status: "open", x: 55, y: 40, note: "Operational passenger elevator." },
      { id: "restroom", label: "Public Restroom", type: "restroom", status: "limited", x: 76, y: 26, note: "Assistance may be required due to tight 1200mm turning corridor." },
      { id: "help", label: "Civic Helpdesk", type: "help", status: "open", x: 34, y: 30, note: "Civic center token assistance counter." },
    ],
  },
  {
    id: "alkapuri-public-library",
    name: "Alkapuri Public Reading Room & Community Library",
    address: "Near Jetalpur Bridge, Alkapuri, Vadodara, Gujarat 390007",
    builder: "Vadodara Urban Development Authority",
    rating: 3.1,
    status: "red",
    lastAudit: "04 Apr 2026",
    accessibleFeatures: [
      "Ground-floor Newspaper Reading Hall",
      "Designated Reserved Parking Spot"
    ],
    coordinates: { lat: 22.3098, lng: 73.1785 },
    auditor: "Open Access Gujarat",
    category: "library",
    report: {
      score: 58,
      rating: 3.1,
      summary: "Critical accessibility barriers identified. Entry ramp slope is excessively steep (1:7) and first-floor reference section lacks elevator access.",
      checkedAt: "04 Apr 2026",
      gaps: [
        {
          id: "alk-gap-1",
          title: "Entry Ramp Exceeds Permissible Gradient (1:7 measured)",
          severity: "critical",
          reference: "NBC 2016 · 4.1.3",
          recommendation: "Reconstruct entrance ramp to maximum 1:12 slope with 1500mm level rest landings.",
        },
        {
          id: "alk-gap-2",
          title: "No Accessible Vertical Circulation to 1st Floor Stacks",
          severity: "critical",
          reference: "RPwD Act · Section 41",
          recommendation: "Install hydraulic platform lift or relocate key book lending services to the ground floor.",
        },
        {
          id: "alk-gap-3",
          title: "Door Widths Below 900mm Clear Standard",
          severity: "moderate",
          reference: "NBC 2016 · 4.4.1",
          recommendation: "Widen public entry door frames to 950mm.",
        },
      ],
    },
    audit: {
      id: "audit-alk-01",
      auditorName: "Open Access Gujarat",
      submittedAt: "04 Apr 2026",
      status: "pending",
      summary: "Initial field audit submitted. Remediation notice served to building administrator.",
    },
    wayfinding: [
      { id: "entrance", label: "Steep Entry Ramp", type: "ramp", status: "limited", x: 18, y: 72, note: "Steep gradient (1:7). Attendant assistance strongly advised." },
      { id: "lift", label: "Upper Floor Access", type: "lift", status: "closed", x: 55, y: 38, note: "No elevator available. Staircase only." },
      { id: "restroom", label: "Ground Restroom", type: "restroom", status: "limited", x: 76, y: 28, note: "Non-accessible 700mm door width." },
      { id: "help", label: "Librarian Service Counter", type: "help", status: "open", x: 34, y: 30, note: "Staff will retrieve books from upper floors upon request." },
    ],
  },
];

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  fakeStrikes: number;
  createdAt: string;
};

export type BuddyRequestRecord = {
  id: string;
  userName: string;
  contactNumber: string;
  location: string;
  assistanceType: string;
  status: "pending" | "accepted" | "completed";
  acceptedBy?: string;
  createdAt: string;
};

export type DetailedAuditorReport = {
  auditorName: string;
  auditorDesignation: string;
  certificateId: string;
  inspectionDate: string;
  rampSlopeVerified: string;
  doorClearanceVerified: string;
  tactilePavingQuality: string;
  washroomClearanceVerified: boolean;
  brailleSignageMounted: boolean;
  emergencyRefugeVerified: boolean;
  detailedObservations: string;
  correctiveActionsRequired: string;
  attachedProofFiles: string[];
  recommendationDecision: "approved" | "rejected";
};

export type AuditRecord = {
  id: string;
  buildingId?: string;
  buildingName: string;
  builderName: string;
  blueprintName?: string;
  stage: "blueprint_approval" | "on_site_inspection";
  submittedAt: string;
  status: "pending" | "accepted_in_review" | "delayed" | "approved" | "rejected";
  aiScore?: number;
  aiReport?: any;
  provisions?: Record<string, boolean>;
  auditorNotes?: string;
  delayReason?: string;
  auditorName?: string;
  reviewedAt?: string;
  detailedReport?: DetailedAuditorReport;
};

type DBState = {
  users: UserRecord[];
  buildings: BuildingRecord[];
  complaints: Complaint[];
  ngos: Ngo[];
  volunteerBookings: VolunteerBooking[];
  safeSpots: SafeSpot[];
  buddyRequests: BuddyRequestRecord[];
  auditQueue: AuditRecord[];
};

const defaultState: DBState = {
  users: [
    {
      id: "demo-user-1",
      email: "citizen@sugamyasetu.in",
      passwordHash: "demo_hashed_password",
      name: "Aarya Patel",
      role: "citizen",
      fakeStrikes: 0,
      createdAt: new Date().toISOString(),
    }
  ],
  buildings: initialBuildings,
  complaints: [],
  ngos: [
    { id: "ngo-1", name: "Sarthak Prayas", type: "Disability NGO", focus: "Mobility aids", address: "Navrangpura, Ahmedabad", tasks: ["Distribute wheelchairs", "Assist at medical camp", "Teach basic sign language"] },
    { id: "ngo-2", name: "Anand Vrudhashram", type: "Old Age Home", focus: "Elder care", address: "Waghodia Road, Vadodara", tasks: ["Read to residents", "Organize musical evening", "Serve meals"] },
    { id: "ngo-3", name: "Udaan Foundation", type: "Special Needs School", focus: "Education", address: "Koramangala, Bengaluru", tasks: ["Help with art class", "Campus cleaning", "Exam scribe"] }
  ],
  volunteerBookings: [],
  safeSpots: [
    { id: "spot-1", name: "North Wing Refuge Area", buildingId: "ssg-hospital", note: "Fireproof doors. Oxygen masks available in red bin." },
    { id: "spot-2", name: "Ground Floor Atrium", buildingId: "vadodara-civic-centre", note: "Clear of glass windows. Stretcher access available." }
  ],
  buddyRequests: [
    {
      id: "buddy-1",
      userName: "Ramesh Shah",
      contactNumber: "+91 98250 11223",
      location: "SSG Hospital Entry Gate 2",
      assistanceType: "Wheelchair escort to OPD",
      status: "pending",
      createdAt: new Date().toISOString(),
    }
  ],
  auditQueue: [
    {
      id: "audit-job-01",
      buildingName: "Alkapuri Civic Complex Phase 2",
      builderName: "Vadodara Urban Development Authority",
      blueprintName: "Alkapuri_Phase2_Layout_v3.dwg",
      stage: "blueprint_approval",
      submittedAt: new Date().toISOString(),
      status: "pending",
      aiScore: 92,
      aiReport: {
        score: 92,
        rating: 4.6,
        summary: "High compliance with NBC 2016. Main entry ramp and tactile paving verified.",
        gaps: [
          {
            id: "gap-signage",
            title: "Braille Signage Height Adjustment",
            severity: "minor",
            reference: "NBC 2016 4.3.2",
            recommendation: "Ensure tactile Braille plaques are mounted at 1.4m height."
          }
        ]
      },
      provisions: {
        liftAvailable: true,
        accessibleRestrooms: true,
        tactilePath: true,
        accessibleParking: true,
        signageContrast: true,
        emergencyRefuge: false,
      }
    },
    {
      id: "audit-job-02",
      buildingName: "SSG Hospital New Trauma Wing",
      builderName: "Dept of Health, Govt of Gujarat",
      blueprintName: "Trauma_Wing_Onsite_Plan.pdf",
      stage: "on_site_inspection",
      submittedAt: new Date().toISOString(),
      status: "pending",
      aiScore: 96,
      aiReport: {
        score: 96,
        rating: 4.8,
        summary: "Excellent structural adherence during construction stage.",
        gaps: []
      },
      provisions: {
        liftAvailable: true,
        accessibleRestrooms: true,
        tactilePath: true,
        accessibleParking: true,
        signageContrast: true,
        emergencyRefuge: true,
      }
    }
  ]
};

export function getDB(): DBState {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), "utf8");
    return defaultState;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const data = JSON.parse(raw);
    
    // Migration from old array format
    if (Array.isArray(data)) {
      const migratedState = { ...defaultState, buildings: data };
      fs.writeFileSync(DB_FILE, JSON.stringify(migratedState, null, 2), "utf8");
      return migratedState;
    }
    
    // Ensure all collections exist
    return { ...defaultState, ...data };
  } catch {
    return defaultState;
  }
}

export function saveDB(data: DBState): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getBuildings(): BuildingRecord[] {
  return getDB().buildings;
}

export function saveBuildings(data: BuildingRecord[]): void {
  const db = getDB();
  db.buildings = data;
  saveDB(db);
}
