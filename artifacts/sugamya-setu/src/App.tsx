import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetBuilding, useGetDashboardSummary, useListBuildings, useRunComplianceCheck, useSubmitAudit, getGetBuildingQueryKey, getGetDashboardSummaryQueryKey, getListBuildingsQueryKey } from '@workspace/api-client-react';
import type { Building, BuildingDetail, ComplianceInput, ComplianceReport, Gap, AuditInput } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
  Check, ChevronRight, CircleAlert, ClipboardCheck, Compass, FileCheck2, 
  FileUp, Footprints, Info, Landmark, LayoutDashboard, Loader2, MapPin, 
  Menu, Search, Send, ShieldCheck, Star, X, Volume2, Eye, Contrast, 
  Camera, CameraOff, Navigation, AlertOctagon, Heart, Phone, Users, 
  Mic, User, Shield, HelpCircle, Gift, Calendar, Plus, Map, CheckSquare
} from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// Add new routes to navigation
const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/audit', label: 'Architect Audit', icon: FileCheck2 },
  { href: '/inspections', label: 'Field Inspection', icon: ClipboardCheck },
  { href: '/complaints', label: 'Complaints Pipeline', icon: AlertOctagon },
  { href: '/volunteering', label: 'Volunteering & NGOs', icon: Heart },
  { href: '/helplines', label: 'Helplines', icon: Phone },
  { href: '/safe-spots', label: 'Safe Spots', icon: ShieldCheck },
  { href: '/buddy', label: 'Find a Buddy', icon: Users }
];

// Offline & Local Storage Mock Database Setup
const INITIAL_BUILDINGS = [
  {
    id: "apex-hospital",
    name: "Apex Care Hospital",
    address: "Shivajinagar, Ward 15, Vadodara, Maharashtra",
    builder: "Vadodara Health Infrastructure",
    rating: 4.8,
    status: "green" as const,
    lastAudit: "10 Aug 2026",
    accessibleFeatures: ["Step-free entry", "Tactile path", "Braille lift", "Accessible restroom", "Emergency alarm in toilets"],
    coordinates: { lat: 18.531, lng: 73.844 },
    auditor: "National Access Audit Association",
    category: "hospital",
    report: {
      score: 98,
      rating: 4.8,
      summary: "Excellent compliance with NBC 2016. Braille directional maps installed at reception.",
      checkedAt: "10 Aug 2026",
      gaps: [],
    },
    audit: {
      id: "audit-apex-01",
      auditorName: "National Access Audit Association",
      submittedAt: "10 Aug 2026",
      status: "verified" as const,
      summary: "Verified all parameters on-site. Accessible restrooms have grab rails at 750mm height.",
    },
    wayfinding: [
      { id: "entrance", label: "Main entrance ramp", type: "ramp", status: "open" as const, x: 20, y: 80, note: "Ramp with 1:12 slope and double handrails." },
      { id: "lift", label: "Central elevator bank", type: "lift", status: "open" as const, x: 50, y: 40, note: "Fitted with voice announcement and Braille keys." },
      { id: "restroom", label: "Ground floor accessible washroom", type: "restroom", status: "open" as const, x: 80, y: 30, note: "Sliding door with grab rails." },
    ],
  },
  {
    id: "vidhan-bhavan",
    name: "Vadodara Ward 15 Office",
    address: "Shivajinagar, Vadodara, Maharashtra",
    builder: "Vadodara Municipal Corporation",
    rating: 4.7,
    status: "green" as const,
    lastAudit: "12 Jun 2026",
    accessibleFeatures: ["Step-free entry", "Tactile path", "Induction loop", "Accessible restroom"],
    coordinates: { lat: 18.532, lng: 73.845 },
    auditor: "AccessWorks India",
    category: "government",
    report: {
      score: 94,
      rating: 4.7,
      summary: "Strong alignment with RPwD Act and National Building Code requirements. One minor signage gap remains.",
      checkedAt: "12 Jun 2026",
      gaps: [
        {
          id: "gap-signage",
          title: "Wayfinding signage contrast",
          severity: "minor" as const,
          reference: "NBC 2016 · 4.3.2",
          recommendation: "Increase luminance contrast on the second-floor directional signs.",
        },
      ],
    },
    audit: {
      id: "audit-vb-01",
      auditorName: "AccessWorks India",
      submittedAt: "12 Jun 2026",
      status: "verified" as const,
      summary: "On-site inspection confirms the AI report. Ramp landing, lift controls, and restroom clearances were measured and verified.",
    },
    wayfinding: [
      { id: "entrance", label: "Accessible entrance", type: "ramp", status: "open" as const, x: 18, y: 71, note: "Proceed 12 metres to the tactile path." },
      { id: "lift", label: "Lift · Ground floor", type: "lift", status: "open" as const, x: 55, y: 39, note: "Lift is operational. Voice announcements enabled." },
      { id: "restroom", label: "Accessible restroom", type: "restroom", status: "open" as const, x: 76, y: 27, note: "Clearance verified at 1,550 mm." },
      { id: "help", label: "Help desk", type: "help", status: "open" as const, x: 34, y: 29, note: "Staff assistance available." },
    ],
  },
  {
    id: "vadodara-civic-centre",
    name: "Vadodara Civic Centre",
    address: "Shivajinagar, Vadodara, Maharashtra",
    builder: "Vadodara Municipal Corporation",
    rating: 3.8,
    status: "amber" as const,
    lastAudit: "28 May 2026",
    accessibleFeatures: ["Step-free entry", "Accessible parking", "Lift access"],
    coordinates: { lat: 18.533, lng: 73.846 },
    auditor: "Inclusive Routes Collective",
    category: "government",
    report: {
      score: 76,
      rating: 3.8,
      summary: "The building is usable for most visitors, but tactile navigation and restroom turning clearances need attention.",
      checkedAt: "28 May 2026",
      gaps: [
        {
          id: "gap-tactile",
          title: "Continuous tactile guidance",
          severity: "critical" as const,
          reference: "RPwD Act · Schedule 2",
          recommendation: "Connect the main entry to reception with a continuous tactile path.",
        },
        {
          id: "gap-restroom",
          title: "Restroom turning clearance",
          severity: "moderate" as const,
          reference: "NBC 2016 · 4.5.4",
          recommendation: "Maintain a 1,500 mm turning circle inside the accessible restroom.",
        },
      ],
    },
    audit: {
      id: "audit-pcc-01",
      auditorName: "Inclusive Routes Collective",
      submittedAt: "28 May 2026",
      status: "verified" as const,
      summary: "Field visit found an operational lift and compliant ramp. Two improvement items remain open from the inspection.",
    },
    wayfinding: [
      { id: "entrance", label: "Main ramp", type: "ramp", status: "open" as const, x: 18, y: 71, note: "Ramp is open. Landing is slightly uneven." },
      { id: "lift", label: "Lift · Ground floor", type: "lift", status: "open" as const, x: 55, y: 39, note: "Lift is operational." },
      { id: "restroom", label: "Accessible restroom", type: "restroom", status: "limited" as const, x: 76, y: 27, note: "Use with assistance; turning clearance is limited." },
      { id: "help", label: "Citizen help desk", type: "help", status: "open" as const, x: 34, y: 29, note: "Staff assistance available." },
    ],
  },
  {
    id: "shivajinagar-library",
    name: "Shivajinagar Community Library",
    address: "Shivajinagar, Vadodara, Maharashtra",
    builder: "Vadodara Urban Development",
    rating: 2.9,
    status: "red" as const,
    lastAudit: "04 Apr 2026",
    accessibleFeatures: ["Ground-floor service desk", "Accessible parking"],
    coordinates: { lat: 18.534, lng: 73.847 },
    auditor: "Open Access Bengaluru",
    category: "library",
    report: {
      score: 58,
      rating: 2.9,
      summary: "Several critical access barriers were identified. The building is not yet independently navigable for wheelchair users.",
      checkedAt: "04 Apr 2026",
      gaps: [
        {
          id: "gap-ramp",
          title: "Ramp slope exceeds standard",
          severity: "critical" as const,
          reference: "NBC 2016 · 4.1.3",
          recommendation: "Rebuild the entry ramp to a maximum 1:12 gradient with level landings.",
        },
        {
          id: "gap-lift",
          title: "No accessible vertical circulation",
          severity: "critical" as const,
          reference: "RPwD Act · Section 41",
          recommendation: "Provide an accessible lift or relocate public services to the entry level.",
        },
        {
          id: "gap-doors",
          title: "Service door width",
          severity: "moderate" as const,
          reference: "NBC 2016 · 4.4.1",
          recommendation: "Increase public-facing door clear width to at least 900 mm.",
        },
      ],
    },
    audit: {
      id: "audit-kcl-01",
      auditorName: "Open Access Bengaluru",
      submittedAt: "04 Apr 2026",
      status: "pending" as const,
      summary: "Initial field report submitted. A follow-up verification is requested after the entry ramp remediation.",
    },
    wayfinding: [
      { id: "entrance", label: "Main entrance", type: "ramp", status: "limited" as const, x: 18, y: 71, note: "Ramp is steep. Assistance recommended." },
      { id: "lift", label: "Lift", type: "lift", status: "closed" as const, x: 55, y: 39, note: "No accessible lift is available." },
      { id: "restroom", label: "Ground-floor restroom", type: "restroom", status: "limited" as const, x: 76, y: 27, note: "Clearance is not verified." },
      { id: "help", label: "Service desk", type: "help", status: "open" as const, x: 34, y: 29, note: "Ask staff for assistance." },
    ],
  },
];

const INITIAL_COMPLAINTS = [
  {
    id: "COMP-101",
    buildingId: "shivajinagar-library",
    buildingName: "Shivajinagar Community Library",
    category: "Ramp Slope",
    details: "The ramp is extremely steep, making it impossible for manual wheelchair users to climb safely.",
    status: "In Progress",
    officer: "Officer Ritesh Deshmukh, CPWD",
    dismissReason: "",
    filedBy: "Asha Rao",
    submittedAt: "2026-08-01T10:00:00Z"
  },
  {
    id: "COMP-102",
    buildingId: "vadodara-civic-centre",
    buildingName: "Vadodara Civic Centre",
    category: "Washroom Clearance",
    details: "Washroom is filled with maintenance cleaning supplies preventing wheelchair access.",
    status: "Resolved",
    officer: "Officer Vikram Malhotra, PMC",
    dismissReason: "",
    filedBy: "Asha Rao",
    submittedAt: "2026-08-05T14:30:00Z"
  }
];

const INITIAL_NGOs = [
  { id: "ngo-1", name: "NCPEDP local chapter", type: "NGO", focus: "Accessibility audits & aid kits", address: "Shivajinagar, Vadodara", tasks: ["Audit assistant", "Record digitisation"] },
  { id: "ngo-2", name: "Samarthyam", type: "NGO", focus: "PwD community representation", address: "Shivajinagar, Vadodara", tasks: ["Companion walk", "Reading assistant"] },
  { id: "ngo-3", name: "AccessAbility", type: "NGO", focus: "Community outreach & awareness", address: "Shivajinagar, Vadodara", tasks: ["Event coordination", "Sign language support"] },
];

const HELPLINE_DIRECTORY = [
  { name: "Police Emergency", number: "112 / 100", authority: "Local Police", tags: "emergency, safety, police" },
  { name: "Ambulance & Medical", number: "102 / 108", authority: "State Health Dept", tags: "medical, hospital, ambulance" },
  { name: "Mental Health Helpline (KIRAN)", number: "1800-599-0019", authority: "Min. of Social Justice", tags: "mental health, counseling, aid" },
  { name: "National Disability Helpline", number: "011-23386128", authority: "Dept of Empowerment of PwD", tags: "disability, query, guidance" },
  { name: "Senior Citizens National Helpline", number: "14567", authority: "Min. of Social Justice", tags: "elderly, senior citizens, vrudhashram" },
  { name: "Women Helpline", number: "1091", authority: "National Commission for Women", tags: "women, emergency, safety" },
];

function BrandMark() {
  return <div className="flex items-center gap-3">
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-md border border-[hsl(var(--accent))] bg-white">
      <img src="/logo.jpg" alt="Sarvasya Logo" className="h-full w-full object-cover" />
    </div>
    <div>
      <div className="font-serif text-xl font-bold tracking-tight text-[hsl(var(--sidebar-foreground))]">Sarvasya</div>
      <div className="font-data text-[9px] uppercase tracking-[.25em] text-[hsl(var(--accent))] font-semibold">Access for all</div>
    </div>
  </div>;
}

// Global state hooks / helper for Offline-First mock database
function useMockDB() {
  const [buildings, setBuildings] = useState<any[]>(() => {
    const cached = localStorage.getItem("sarvasya_buildings");
    return cached ? JSON.parse(cached) : INITIAL_BUILDINGS;
  });

  const [complaints, setComplaints] = useState<any[]>(() => {
    const cached = localStorage.getItem("sarvasya_complaints");
    return cached ? JSON.parse(cached) : INITIAL_COMPLAINTS;
  });

  const [volunteers, setVolunteers] = useState<any[]>(() => {
    const cached = localStorage.getItem("sarvasya_volunteers");
    return cached ? JSON.parse(cached) : [];
  });

  const [safeSpots, setSafeSpots] = useState<any[]>(() => {
    const cached = localStorage.getItem("sarvasya_safespots");
    return cached ? JSON.parse(cached) : [
      { id: "ss-1", name: "Apex Care Lobby Refuge Area", buildingId: "apex-hospital", note: "Fitted with fireproof door and wheelchair parking." }
    ];
  });

  const [profile, setProfile] = useState<any>(() => {
    const cached = localStorage.getItem("sarvasya_profile");
    return cached ? JSON.parse(cached) : { name: "Asha Rao", role: "citizen", email: "asha@accessnow.org", fakeStrikes: 0 };
  });

  const save = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addComplaint = (complaint: any) => {
    const updated = [complaint, ...complaints];
    setComplaints(updated);
    save("sarvasya_complaints", updated);
  };

  const updateComplaintStatus = (id: string, status: string, reason?: string) => {
    const updated = complaints.map(c => {
      if (c.id === id) {
        let strikes = profile.fakeStrikes;
        if (status === "Dismissed" && reason?.toLowerCase().includes("fake")) {
          strikes += 1;
          const updatedProfile = { ...profile, fakeStrikes: strikes };
          setProfile(updatedProfile);
          save("sarvasya_profile", updatedProfile);
        }
        return { ...c, status, dismissReason: reason || "" };
      }
      return c;
    });
    setComplaints(updated);
    save("sarvasya_complaints", updated);
  };

  const addVolunteerBooking = (booking: any) => {
    const updated = [booking, ...volunteers];
    setVolunteers(updated);
    save("sarvasya_volunteers", updated);
  };

  const addSafeSpot = (spot: any) => {
    const updated = [spot, ...safeSpots];
    setSafeSpots(updated);
    save("sarvasya_safespots", updated);
  };

  const registerUser = (user: any) => {
    setProfile(user);
    save("sarvasya_profile", user);
  };

  return {
    buildings,
    complaints,
    volunteers,
    safeSpots,
    profile,
    addComplaint,
    updateComplaintStatus,
    addVolunteerBooking,
    addSafeSpot,
    registerUser
  };
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [reading, setReading] = useState(false);
  
  // Accessibility scale and colorblind themes
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [colorblindTheme, setColorblindTheme] = useState<'none' | 'deuteranopia' | 'tritanopia'>('none');
  
  // Emergency and remote tracking state
  const [emergencyAlert, setEmergencyAlert] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingLocation, setTrackingLocation] = useState("Lobby Ramp Entry");
  
  // Hands-free voice commands
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [simulatedSign, setSimulatedSign] = useState<string | null>(null);

  // Easy Registration Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const { profile, registerUser } = useMockDB();
  const [regName, setRegName] = useState(profile.name || "");
  const [regEmail, setRegEmail] = useState(profile.email || "");
  const [regRole, setRegRole] = useState(profile.role || "citizen");

  // Offline status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('color-inverted', inverted);
    
    // Set scale
    root.style.fontSize = `${15 * (zoomLevel / 100)}px`;

    // Set colorblind theme
    root.classList.remove('colorblind-deuteranopia', 'colorblind-tritanopia');
    if (colorblindTheme !== 'none') {
      root.classList.add(`colorblind-${colorblindTheme}`);
    }

    return () => {
      root.classList.remove('high-contrast', 'color-inverted', 'text-size-sm', 'text-size-base', 'text-size-lg', 'colorblind-deuteranopia', 'colorblind-tritanopia');
      root.style.fontSize = '';
      window.speechSynthesis?.cancel();
    };
  }, [highContrast, inverted, zoomLevel, colorblindTheme]);

  const readPage = () => {
    if (!('speechSynthesis' in window)) return;
    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const text = document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim();
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 5000));
    utterance.rate = 0.95;
    utterance.onend = () => setReading(false);
    window.speechSynthesis.speak(utterance);
    setReading(true);
  };

  const triggerEmergency = () => {
    setEmergencyAlert(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance("Emergency alert broadcasted silently. Nearby volunteers and security are notified."));
    }
    setTimeout(() => setEmergencyAlert(false), 5000);
  };

  // Mock voice control loop
  const toggleVoiceMode = () => {
    if (voiceActive) {
      setVoiceActive(false);
      setVoiceTranscript("");
      return;
    }
    setVoiceActive(true);
    setVoiceTranscript("Listening for commands (e.g. 'go to audits', 'read signage')");
  };

  const handleVoiceCommand = (cmd: string) => {
    setVoiceTranscript(`Executing: "${cmd}"`);
    if (cmd.includes("audit") || cmd.includes("check")) {
      window.location.hash = "/audit";
    } else if (cmd.includes("help") || cmd.includes("number")) {
      window.location.hash = "/helplines";
    } else if (cmd.includes("sign") || cmd.includes("board")) {
      setSimulatedSign("CAUTION: Steep ramp. Wheelchair assistance recommended on left.");
      if ('speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("Sign reads: Caution. Steep ramp. Wheelchair assistance recommended on left."));
      }
    }
  };

  return <div className="civic-shell">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <aside className="civic-nav desktop-nav bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))]" aria-label="Sidebar navigation">
      <BrandMark />
      
      {/* Offline Status & User profile in navigation */}
      <div className="mt-6 flex flex-col gap-2 rounded-xl bg-black/20 p-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-green-500'}`} />
            <span className="font-semibold uppercase tracking-wider">{isOffline ? 'Offline Cache' : 'Online API'}</span>
          </div>
          <button onClick={() => setShowRegModal(true)} className="text-[hsl(var(--accent))] hover:underline flex items-center gap-1 font-bold">
            <User size={13} /> {profile.name ? 'Edit' : 'Login'}
          </button>
        </div>
        {profile.name && (
          <div className="text-[hsl(var(--sidebar-foreground)/.7)] truncate">
            {profile.name} ({profile.role})
            {profile.fakeStrikes > 0 && <div className="text-red-400 font-semibold text-[10px]">Strikes: {profile.fakeStrikes}/3</div>}
          </div>
        )}
      </div>

      <div className="mt-6 mb-3 px-3 font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.48)]">Workspace</div>
      <nav className="space-y-1" aria-label="Primary navigation">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`nav-link flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${location === href ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.72)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-[hsl(var(--sidebar-foreground))]'}`}>
          <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{location === href && <ChevronRight className="ml-auto" size={15} />}
        </Link>)}
      </nav>
      
      {/* Remote Tracking Status Panel */}
      {trackingActive && (
        <div className="mt-4 rounded-xl border border-dashed border-[hsl(var(--accent))] bg-[hsl(var(--sidebar-accent)/.3)] p-3 text-xs">
          <div className="flex items-center gap-2 text-[hsl(var(--accent))] font-bold">
            <Users size={14} /> Caregiver Track Active
          </div>
          <p className="mt-1 text-[11px] text-white/70">Remote link active. Location: <strong>{trackingLocation}</strong></p>
        </div>
      )}
    </aside>
    
    <div className="civic-main">
      <header className="mobile-nav items-center justify-between bg-[hsl(var(--sidebar))] px-4 py-4 text-[hsl(var(--sidebar-foreground))]" aria-label="Mobile header">
        <BrandMark />
        <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle navigation" data-testid="button-toggle-navigation" className="rounded-lg p-2 hover:bg-[hsl(var(--sidebar-accent))]">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </header>
      {menuOpen && <nav className="mobile-nav flex-col gap-1 bg-[hsl(var(--sidebar))] px-4 pb-4 text-[hsl(var(--sidebar-foreground))]" aria-label="Mobile navigation">
        {navItems.map(({ href, label, icon: Icon }) => <Link onClick={() => setMenuOpen(false)} key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[hsl(var(--sidebar-accent))]"><Icon size={18} />{label}</Link>)}
      </nav>}
      
      {/* Voice Hands-Free Bar */}
      {voiceActive && (
        <div className="bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))] p-3 px-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mic size={18} className="text-red-500 pulse-voice" />
            <span className="text-xs font-semibold">{voiceTranscript}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleVoiceCommand("read signage")} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded px-2.5 py-1 text-[10px] font-bold">Read sign</button>
            <button onClick={() => handleVoiceCommand("go to audits")} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded px-2.5 py-1 text-[10px] font-bold">Go to Audits</button>
            <button onClick={() => handleVoiceCommand("help")} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded px-2.5 py-1 text-[10px] font-bold">Helplines</button>
          </div>
        </div>
      )}

      {/* Simulated Sign Reader Result Popup */}
      {simulatedSign && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 text-xs font-semibold flex justify-between items-center">
          <div className="flex items-center gap-2 text-yellow-800">
            <Volume2 size={16} /> <span>Sign Reader: {simulatedSign}</span>
          </div>
          <button onClick={() => setSimulatedSign(null)} className="text-yellow-800 hover:text-black"><X size={14} /></button>
        </div>
      )}

      {/* Silent emergency broadcast banner */}
      {emergencyAlert && (
        <div className="bg-red-600 text-white p-4 px-6 font-bold text-center text-sm pulse-emergency flex items-center justify-center gap-3">
          <AlertOctagon /> SILENT EMERGENCY BROADCAST: Location and aid requested at Apex Care Lobby Refuge Area! Volunteers notified.
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="outline-none flex-1 pb-16">{children}</main>
      
      {/* Enhanced Accessibility & Assistive Action Toolbars */}
      <div className="accessibility-toolbar flex-wrap gap-2 md:max-w-4xl" aria-label="Accessibility and Safety tools">
        {/* Font controls */}
        <div className="flex border-r border-[hsl(var(--border))] pr-2 mr-1 items-center gap-1">
          <button type="button" onClick={() => setZoomLevel(z => Math.max(10, z - 10))} title="Zoom out"><span className="text-[10px]">A-</span></button>
          <span className="text-[9px] font-mono px-1">{zoomLevel}%</span>
          <button type="button" onClick={() => setZoomLevel(z => z + 10)} title="Zoom in"><span className="text-sm">A+</span></button>
          <button type="button" onClick={() => setZoomLevel(100)} title="Reset zoom" className="ml-1 text-[9px] underline">Reset</button>
        </div>

        {/* Colorblind Dropdown */}
        <select 
          aria-label="Colorblind filter theme selector" 
          value={colorblindTheme} 
          onChange={(e) => setColorblindTheme(e.target.value as any)}
          className="text-[9px] font-mono font-bold bg-transparent border-0 outline-none uppercase p-1 mr-2"
        >
          <option value="none">Colorblind: Off</option>
          <option value="deuteranopia">Red-Green Mode</option>
          <option value="tritanopia">Blue-Yellow Mode</option>
        </select>

        {/* Standard controls */}
        <button type="button" onClick={readPage} aria-pressed={reading} title={reading ? 'Stop reading' : 'Read aloud'}><Volume2 size={15} /><span>Read Aloud</span></button>
        <button type="button" onClick={() => setHighContrast((v) => !v)} aria-pressed={highContrast} title="Toggle high contrast"><Contrast size={15} /><span>Contrast</span></button>
        <button type="button" onClick={() => setInverted((v) => !v)} aria-pressed={inverted} title="Toggle color inversion"><Eye size={15} /><span>Invert</span></button>

        {/* Emergency & Tracking buttons */}
        <button type="button" onClick={triggerEmergency} className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 flex items-center gap-1 font-bold animate-pulse" title="Silent Emergency Alert">
          <AlertOctagon size={15} /> <span>Emergency</span>
        </button>

        <button type="button" onClick={() => setTrackingActive(!trackingActive)} aria-pressed={trackingActive} className="bg-blue-600 text-white rounded-lg px-3 py-2 flex items-center gap-1 font-bold" title="Toggle Remote Caregiver Tracking">
          <Users size={15} /> <span>Track Pass</span>
        </button>

        <button type="button" onClick={toggleVoiceMode} aria-pressed={voiceActive} className="bg-teal-600 text-white rounded-lg px-3 py-2 flex items-center gap-1 font-bold" title="Toggle hands-free voice control mode">
          <Mic size={15} /> <span>Voice Mode</span>
        </button>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 border-t border-[hsl(var(--border))] py-6 px-4 md:px-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
        <p className="font-bold mb-1">Built by Team Code-Blooded</p>
        <p>Hetanshi Sidhpura · Aaryan Jaiswal · Dhruvi Jamnapara</p>
        <p className="mt-2 text-[10px] uppercase tracking-wider">Drs. Kiran &amp; Pallavi Patel Global University · Yi Vadodara Chapter</p>
      </footer>
    </div>

    {/* Registration Modal Overlay */}
    {showRegModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--card-border))] rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex justify-between items-center border-b border-[hsl(var(--border))] pb-3 mb-4">
            <h3 className="font-display text-xl font-bold">Easy Registration</h3>
            <button onClick={() => setShowRegModal(false)} className="hover:opacity-70"><X /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            registerUser({ name: regName, email: regEmail, role: regRole, fakeStrikes: profile.fakeStrikes || 0 });
            setShowRegModal(false);
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">Full Name</label>
              <input required value={regName} onChange={(e) => setRegName(e.target.value)} type="text" className="w-full h-10 border rounded-lg px-3 text-sm" placeholder="Asha Rao" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Email / Phone</label>
              <input required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} type="text" className="w-full h-10 border rounded-lg px-3 text-sm" placeholder="asha@accessnow.org" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Profile Role</label>
              <select value={regRole} onChange={(e) => setRegRole(e.target.value)} className="w-full h-10 border rounded-lg px-3 text-sm">
                <option value="citizen">Citizen (File complaints/Audits)</option>
                <option value="officer">Officer (Resolve/Dismiss complaints)</option>
                <option value="volunteer">Volunteer (Volunteer / Donate)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-[hsl(var(--primary))] text-white rounded-lg h-11 font-bold">Save Registration</button>
          </form>
        </div>
      </div>
    )}
  </div>;
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: ReactNode; description: string; children?: ReactNode }) {
  return <section className="paper-grid border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-9 md:px-10 md:py-12">
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="animate-rise">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/.2)] bg-[hsl(var(--primary)/.08)] px-3 py-1 font-data text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--primary))]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
          {eyebrow}
        </div>
        <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[hsl(var(--foreground))] text-balance md:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))] md:text-base font-sans">{description}</p>
      </div>
      {children && <div className="animate-rise stagger-2">{children}</div>}
    </div>
  </section>;
}

function StatusBadge({ status }: { status: Building['status'] }) {
  const labels = { green: 'Compliant', amber: 'Needs attention', red: 'Action required' };
  return <span data-testid={`status-building-${status}`} className="inline-flex items-center gap-2 rounded-full border border-current/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.11em]">
    <span className={`status-dot status-${status}`} />{labels[status]}
  </span>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent?: string }) {
  return <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-sm transition-all hover:shadow-md">
    <div className={`absolute left-0 top-0 h-1.5 w-full ${accent ?? 'bg-[hsl(var(--primary))]'}`} />
    <div className="font-data text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{label}</div>
    <div data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} className="metric-number font-serif mt-3 text-4xl font-extrabold text-[hsl(var(--foreground))]">{value}</div>
    <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))] font-sans">{note}</div>
  </div>;
}

function LoadingState({ label = 'Loading public records' }: { label?: string }) {
  return <div className="space-y-4" data-testid="state-loading"><div className="skeleton h-20 rounded-xl" /><div className="skeleton h-20 rounded-xl" /><div className="flex items-center gap-2 pt-1 text-xs text-[hsl(var(--muted-foreground))]"><Loader2 size={14} className="animate-spin" />{label}</div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="rounded-xl border border-[#e3b8b2] bg-[#f9e9e5] p-6 text-[#823b35]" data-testid="state-error"><div className="flex items-center gap-2 font-bold"><CircleAlert size={18} /> Records unavailable</div><p className="mt-2 text-sm">We could not connect to the public register. Please try again.</p><button onClick={onRetry} type="button" data-testid="button-retry" className="mt-4 rounded-lg bg-[#823b35] px-4 py-2 text-xs font-bold text-[#fff8ed] transition-transform hover:-translate-y-0.5">Try again</button></div>;
}

function EmptyState({ query }: { query?: string }) {
  return <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] p-12 text-center" data-testid="state-empty"><Search className="mx-auto text-[hsl(var(--muted-foreground))]" size={28} /><h3 className="mt-4 font-display text-xl font-bold">No buildings found</h3><p className="mx-auto mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">{query ? `Nothing matched “${query}”. Try a neighbourhood or a different status.` : 'The directory is ready for its first verified record.'}</p></div>;
}

function StarRating({ rating }: { rating: number }) {
  return <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`} data-testid="rating-stars">{[0, 1, 2, 3, 4].map((index) => <Star key={index} size={15} aria-hidden="true" fill={index < Math.round(rating) ? 'currentColor' : 'none'} className={index < Math.round(rating) ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--border))]'} />)}<span className="ml-1 font-data text-xs" aria-hidden="true">{rating.toFixed(1)}</span></div>;
}

// Map ratings logic: Calculate building compliance score based on complaints
function calculateRating(building: any, complaintsList: any[]) {
  const buildingComplaints = complaintsList.filter(c => c.buildingId === building.id);
  const activeCount = buildingComplaints.filter(c => c.status !== "Resolved").length;
  const initialScore = building.report?.score || 80;
  
  // Deduct 8 points for each unresolved gap/complaint
  const score = Math.max(20, initialScore - (activeCount * 8));
  return Number((1 + score / 25).toFixed(1));
}

function Dashboard() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'green' | 'amber' | 'red'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'hospital' | 'government' | 'library'>('all');
  
  const { buildings, complaints } = useMockDB();

  const filteredBuildings = useMemo(() => {
    return buildings.filter(building => {
      const matchesQuery = building.name.toLowerCase().includes(query.toLowerCase()) || 
                           building.address.toLowerCase().includes(query.toLowerCase()) ||
                           building.builder.toLowerCase().includes(query.toLowerCase());
      
      const dynamicRating = calculateRating(building, complaints);
      let calculatedStatus = building.status;
      if (dynamicRating >= 4.5) calculatedStatus = 'green';
      else if (dynamicRating >= 3.5) calculatedStatus = 'amber';
      else calculatedStatus = 'red';

      const matchesStatus = status === 'all' || calculatedStatus === status;
      const matchesCategory = categoryFilter === 'all' || building.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [buildings, query, status, categoryFilter, complaints]);

  const summary = useMemo(() => {
    const total = buildings.length;
    const greenCount = buildings.filter(b => calculateRating(b, complaints) >= 4.5).length;
    const openGapsCount = complaints.filter(c => c.status !== "Resolved").length;
    const avgRating = buildings.reduce((acc, b) => acc + calculateRating(b, complaints), 0) / total;

    return {
      buildings: total,
      verified: greenCount,
      openGaps: openGapsCount,
      averageRating: avgRating,
      updatedAt: new Date().toISOString()
    };
  }, [buildings, complaints]);

  return <div>
    <PageHeader eyebrow="Public Accessibility Directory" title={<>Access for everyone,<br /><span className="text-[hsl(var(--primary))]">everywhere.</span></>} description="Explore and verify the accessibility of public buildings across India. Plan your visits with confidence and help us improve public access by sharing your experience.">
      <Link href="/audit" data-testid="link-start-audit" className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-civic transition-transform hover:-translate-y-0.5">Check a building plan <ChevronRight size={16} /></Link>
    </PageHeader>
    <div className="mx-auto max-w-[1240px] px-5 py-7 md:px-10 md:py-9">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Buildings mapped" value={String(summary.buildings)} note="Across public jurisdictions" />
        <Metric label="Verified recently" value={String(summary.verified)} note="Audited and compliant" accent="bg-[#32805e]" />
        <Metric label="Open accessibility issues" value={String(summary.openGaps)} note="Reported by community" accent="bg-[#c28b1b]" />
        <Metric label="Average rating" value={summary.averageRating.toFixed(1)} note="Updated live from audits" accent="bg-[hsl(var(--accent))]" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0 animate-rise">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">Open directory</div>
              <h2 className="mt-1 font-display text-3xl font-bold">Public buildings</h2>
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]" aria-live="polite">
              {filteredBuildings.length} records in view
            </div>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-civic">
            {/* Filters including Hospitals highlight */}
            <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.32)] p-3 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input data-testid="input-building-search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search buildings by name, neighbourhood or builder" placeholder="Search building, neighbourhood or builder" className="h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-[hsl(var(--muted-foreground))] focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]" />
              </div>
              <div className="flex gap-2">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)} aria-label="Filter by building category" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]">
                  <option value="all">All Categories</option>
                  <option value="hospital">Hospitals (Important)</option>
                  <option value="government">Government Offices</option>
                  <option value="library">Libraries</option>
                </select>
                <select data-testid="select-building-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter buildings by compliance status" className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]">
                  <option value="all">All statuses</option>
                  <option value="green">Compliant</option>
                  <option value="amber">Needs attention</option>
                  <option value="red">Action required</option>
                </select>
              </div>
            </div>
            
            <div className="hidden grid-cols-[1.45fr_1fr_auto_auto] gap-4 border-b border-[hsl(var(--border))] px-4 py-3 font-data text-[9px] uppercase tracking-[.13em] text-[hsl(var(--muted-foreground))] md:grid">
              <span>Building</span>
              <span>Builder</span>
              <span>Accessibility Rating</span>
              <span>Status</span>
            </div>
            
            {filteredBuildings.length ? filteredBuildings.map((building) => {
              const dynRating = calculateRating(building, complaints);
              let dynStatus = building.status;
              if (dynRating >= 4.5) dynStatus = 'green';
              else if (dynRating >= 3.5) dynStatus = 'amber';
              else dynStatus = 'red';

              return (
                <Link key={building.id} href={`/buildings/${building.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[hsl(var(--border))] px-4 py-4 transition-colors hover:bg-[hsl(var(--secondary)/.5)] md:grid-cols-[1.45fr_1fr_auto_auto]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold group-hover:text-[hsl(var(--primary))]">{building.name}</h3>
                      {building.category === 'hospital' && <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Heart size={10} /> Hospital</span>}
                    </div>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-[hsl(var(--muted-foreground))]"><MapPin size={12} />{building.address}</p>
                  </div>
                  <div className="hidden text-xs text-[hsl(var(--muted-foreground))] md:block">{building.builder}</div>
                  <StarRating rating={dynRating} />
                  <div className="col-span-2 flex items-center justify-between md:col-span-1">
                    <StatusBadge status={dynStatus} />
                    <ChevronRight size={17} className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            }) : <div className="p-4"><EmptyState query={query} /></div>}
          </div>
        </section>

        {/* Offline Audit & Fast-track shortcuts */}
        <aside className="animate-rise">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">Offline Audit</div>
              <h2 className="mt-1 font-display text-2xl font-bold">Awareness Checklist</h2>
            </div>
            <CheckSquare size={17} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <div className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic mb-6">
            <h3 className="text-xs font-bold mb-3">Basic Access Audit Checklist:</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2"><input type="checkbox" className="mt-0.5" /> <span>Ramp slope at/under 1:12 (8.33%)</span></li>
              <li className="flex items-start gap-2"><input type="checkbox" className="mt-0.5" /> <span>Main doors wide enough (900mm+)</span></li>
              <li className="flex items-start gap-2"><input type="checkbox" className="mt-0.5" /> <span>Lift buttons with Braille & voice guide</span></li>
              <li className="flex items-start gap-2"><input type="checkbox" className="mt-0.5" /> <span>Grab rails in toilets & step-free</span></li>
            </ul>
            <p className="text-[10px] text-muted-foreground mt-3 italic">Use these guidelines to evaluate public buildings offline.</p>
          </div>
          
          <div className="rounded-xl bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))] shadow-civic">
            <Compass size={23} className="mb-8 text-[hsl(var(--accent))]" />
            <h3 className="font-display text-xl font-bold">Safe Spot Shortcuts</h3>
            <p className="mt-2 text-xs leading-5 text-[hsl(var(--primary-foreground)/.7)]">Instantly look up pre-saved safe evacuation refuges inside buildings.</p>
            <Link href="/safe-spots" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[hsl(var(--accent))]">View Safe Spots <ChevronRight size={14} /></Link>
          </div>
        </aside>
      </div>
    </div>
  </div>;
}

function DetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { buildings, complaints } = useMockDB();
  const building = buildings.find(b => b.id === id);

  if (!building) return <div className="mx-auto max-w-[760px] px-5 py-12 md:px-10"><ErrorState onRetry={() => {}} /></div>;
  
  const dynRating = calculateRating(building, complaints);
  let dynStatus = building.status;
  if (dynRating >= 4.5) dynStatus = 'green';
  else if (dynRating >= 3.5) dynStatus = 'amber';
  else dynStatus = 'red';

  const updatedBuilding = {
    ...building,
    rating: dynRating,
    status: dynStatus
  };

  return <BuildingDetailPage building={updatedBuilding} />;
}

function BuildingDetailPage({ building }: { building: any }) {
  const [selectedWayfinding, setSelectedWayfinding] = useState(building.wayfinding[0]?.id);
  const selected = building.wayfinding.find((item: any) => item.id === selectedWayfinding);
  const { safeSpots, addSafeSpot } = useMockDB();

  const handleSaveSafeSpot = () => {
    addSafeSpot({
      id: `ss-${Date.now()}`,
      name: `${building.name} - ${selected?.label || 'Refuge Area'}`,
      buildingId: building.id,
      note: selected?.note || 'Accessible refuge checkpoint'
    });
    alert("Saved to your Safe Spots shortcuts!");
  };

  return <div>
    <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.45)] px-5 py-4 md:px-10"><div className="mx-auto flex max-w-[1240px] items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Link href="/" data-testid="link-back-directory" className="hover:text-[hsl(var(--primary))]">Directory</Link><ChevronRight size={13} /><span className="truncate">{building.name}</span></div></div>
    <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-10 md:py-11">
      <div className="flex flex-col gap-6 border-b border-[hsl(var(--border))] pb-8 md:flex-row md:items-end md:justify-between"><div><div className="font-data text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">Building record / {building.id}</div><h1 data-testid="text-building-name" className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">{building.name}</h1><p className="mt-3 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"><MapPin size={15} />{building.address}</p></div><div className="flex flex-wrap items-center gap-4"><StatusBadge status={building.status} /><StarRating rating={building.rating} /></div></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">At a glance</div>
                <h2 className="mt-1 font-display text-2xl font-bold">Accessibility features</h2>
              </div>
              <Footprints className="text-[hsl(var(--primary))]" />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">{building.accessibleFeatures.map((feature: any, index: number) => <div key={`${feature}-${index}`} data-testid={`feature-${index}`} className="flex items-center gap-3 rounded-lg bg-[hsl(var(--secondary)/.5)] px-3 py-3 text-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dcefe5] text-[#26734e]"><Check size={14} strokeWidth={3} /></span>{feature}</div>)}</div>
          </section>
          
          <ComplianceReportCard report={building.report} />
          
          {/* Quick Evacuation Save Spot Shortcut button */}
          <section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">Save Safe Evacuation Spot</h3>
              <p className="text-xs text-muted-foreground">Save {selected?.label || 'current spot'} as a shortcut for quick retrieval in emergencies.</p>
            </div>
            <button onClick={handleSaveSafeSpot} className="bg-[hsl(var(--primary))] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1">
              <Plus size={14} /> Add Shortcut
            </button>
          </section>
        </div>
        
        <div className="space-y-6"><WayfindingPanel building={building} selectedWayfinding={selectedWayfinding} setSelectedWayfinding={setSelectedWayfinding} selected={selected} /><section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))] shadow-civic md:p-6"><div className="flex items-center gap-2 text-[hsl(var(--accent))]"><Landmark size={18} /><span className="font-data text-[10px] uppercase tracking-[.16em]">Record ownership</span></div><div className="mt-5 grid grid-cols-2 gap-5"><div><div className="text-[10px] text-[hsl(var(--primary-foreground)/.6)]">Builder</div><div className="mt-1 text-sm font-bold">{building.builder}</div></div><div><div className="text-[10px] text-[hsl(var(--primary-foreground)/.6)]">Last audited</div><div className="mt-1 text-sm font-bold">{new Date(building.lastAudit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div><div><div className="text-[10px] text-[hsl(var(--primary-foreground)/.6)]">Auditor</div><div className="mt-1 text-sm font-bold">{building.auditor}</div></div><div><div className="text-[10px] text-[hsl(var(--primary-foreground)/.6)]">Coordinates</div><div className="mt-1 font-data text-xs font-bold">{building.coordinates.lat.toFixed(3)}, {building.coordinates.lng.toFixed(3)}</div></div></div></section></div>
      </div>
    </div>
  </div>;
}

// Wayfinding and Assistive Views
function WayfindingPanel({ building, selectedWayfinding, setSelectedWayfinding, selected }: { building: any; selectedWayfinding?: string; setSelectedWayfinding: (id: string) => void; selected?: any }) {
  const [mode, setMode] = useState<'map' | 'video'>('map');
  return <section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-6"><div className="flex items-center justify-between"><div><div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">Inside the building</div><h2 className="mt-1 font-display text-2xl font-bold">Wayfinding</h2></div><Compass className="text-[hsl(var(--primary))]" /></div><div className="mt-4 flex rounded-lg bg-[hsl(var(--secondary)/.6)] p-1" role="tablist" aria-label="Wayfinding views"><button type="button" id="map-tab" role="tab" aria-selected={mode === 'map'} aria-controls="floor-plan-panel" onClick={() => setMode('map')} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${mode === 'map' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}><Navigation size={14} />Floor plan</button><button type="button" id="video-tab" role="tab" aria-selected={mode === 'video'} aria-controls="assistive-view-panel" onClick={() => setMode('video')} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${mode === 'video' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}><Camera size={14} />Assistive view</button></div>{mode === 'map' ? <div id="floor-plan-panel" role="tabpanel" aria-labelledby="map-tab"><div role="tablist" aria-label="Floor plan wayfinding checkpoints" className="relative mt-5 aspect-[1.1] overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[#eef1e5] paper-grid"><div className="absolute left-[12%] top-[12%] h-[23%] w-[31%] border-2 border-[hsl(var(--primary)/.5)] bg-[#fbfaf1]/75" /><div className="absolute right-[10%] top-[16%] h-[40%] w-[25%] border-2 border-[hsl(var(--primary)/.5)] bg-[#fbfaf1]/75" /><div className="absolute bottom-[11%] left-[13%] h-[27%] w-[56%] border-2 border-[hsl(var(--primary)/.5)] bg-[#fbfaf1]/75" /><div className="absolute bottom-[16%] right-[8%] h-10 w-10 rounded-full border-2 border-dashed border-[hsl(var(--primary)/.6)]" />{building.wayfinding.map((item: any) => {
  const isSelected = selectedWayfinding === item.id;
  return <button type="button" key={item.id} role="tab" aria-selected={isSelected} aria-controls={`wayfinding-detail-${item.id}`} aria-label={`${item.label} (${item.status})`} onClick={() => setSelectedWayfinding(item.id)} data-testid={`button-wayfinding-${item.id}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#fff9ec] p-1.5 shadow transition-transform hover:scale-110 ${isSelected ? 'z-10 scale-125 bg-[hsl(var(--primary))] text-white' : item.status === 'open' ? 'bg-[#32805e] text-white' : item.status === 'limited' ? 'bg-[#c28b1b] text-white' : 'bg-[#b74740] text-white'}`}><MapPin size={13} fill="currentColor" /></button>;
})}</div>{selected && <div id={`wayfinding-detail-${selected.id}`} role="tabpanel" aria-label={`${selected.label} Details`} className="mt-4 rounded-lg bg-[hsl(var(--secondary)/.55)] p-4"><div className="flex items-center justify-between"><div className="font-bold text-sm">{selected.label}</div><span className={`status-${selected.status} rounded-full px-2 py-1 text-[9px] font-bold uppercase`}>{selected.status}</span></div><div className="mt-1 font-data text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{selected.type}</div><p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{selected.note}</p></div>}</div> : <div id="assistive-view-panel" role="tabpanel" aria-labelledby="video-tab"><AssistiveView building={building} /></div>}</section>;
}

function AssistiveView({ building }: { building: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('Ready to guide you through the accessible route.');
  const speak = (text: string) => {
    setMessage(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };
  const toggleCamera = async () => {
    if (active) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setActive(false);
      speak('Assistive camera paused.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setActive(true);
        speak('Camera active. Proceed five metres straight. Accessible ramp ahead to your left.');
      }
    } catch {
      speak('Camera access is unavailable. Showing simulated guidance instead.');
    }
  };
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  return <div className="mt-5"><div className="relative aspect-[1.1] overflow-hidden rounded-lg bg-[#142a2b]"><video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${active ? 'opacity-100' : 'opacity-0'}`} /><div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#224546] via-[#183536] to-[#0e2223]"><div className="text-center text-white/75"><Camera size={32} className="mx-auto mb-3 text-[hsl(var(--accent))]" /><p className="font-data text-[9px] uppercase tracking-[.18em]">{active ? 'Live camera feed' : 'Simulated assistive AR view'}</p><p className="mt-2 text-xs text-white/55">Guidance is based on the published wayfinding record.</p></div></div>{active && <div className="absolute inset-x-4 top-4 rounded-lg border border-[hsl(var(--accent)/.65)] bg-black/45 px-3 py-2 text-xs font-bold text-white">Ramp ahead · 5 m · left</div>}<div className="absolute inset-x-4 bottom-4 flex items-center justify-between"><span className="rounded-full bg-black/45 px-3 py-2 text-[10px] font-bold text-white"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#72d19a]" />{active ? 'Guidance live' : 'Preview mode'}</span><button type="button" onClick={toggleCamera} data-testid="button-toggle-camera" className="flex items-center gap-2 rounded-lg bg-[hsl(var(--accent))] px-3 py-2 text-xs font-bold text-[hsl(var(--foreground))]">{active ? <CameraOff size={14} /> : <Camera size={14} />}{active ? 'Stop camera' : 'Start camera'}</button></div></div><div className="mt-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.55)] p-4"><div className="flex items-start gap-3"><Volume2 size={17} className="mt-0.5 flex-none text-[hsl(var(--primary))]" /><div><div className="text-xs font-bold">Live announcement</div><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{message}</p></div></div><button type="button" onClick={() => speak(`Proceed to the ${building.wayfinding[0]?.label ?? 'accessible entrance'}. ${building.wayfinding[0]?.note ?? ''}`)} data-testid="button-announce-route" className="mt-4 flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))]">Announce next checkpoint <Volume2 size={14} /></button></div></div>;
}

function ComplianceReportCard({ report }: { report: ComplianceReport }) {
  return <section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><div className="flex h-24 w-24 flex-none flex-col items-center justify-center rounded-full border-[10px] border-[#32805e]/20 border-t-[#32805e]"><span data-testid="text-compliance-score" className="font-data text-2xl font-bold">{report.score}</span><span className="text-[9px] uppercase text-[hsl(var(--muted-foreground))]">score</span></div><div><div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">Compliance report</div><h2 className="mt-1 font-display text-2xl font-bold">{report.rating.toFixed(1)} / 5.0 · {report.gaps.length ? 'A few things to fix' : 'Ready for everyone'}</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{report.summary}</p><p className="mt-2 font-data text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Checked {new Date(report.checkedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div></div>{report.gaps.length > 0 && <div className="mt-6 border-t border-[hsl(var(--border))] pt-4"><div className="mb-2 text-xs font-bold">Open recommendations</div>{report.gaps.map((gap) => <GapRow gap={gap} key={gap.id} />)}</div>}</section>;
}

function GapRow({ gap }: { gap: Gap }) {
  return <div className="flex gap-3 border-t border-[hsl(var(--border))] py-3"><span className={`mt-1 h-2 w-2 flex-none rounded-full ${gap.severity === 'critical' ? 'bg-[#b74740]' : gap.severity === 'moderate' ? 'bg-[#c28b1b]' : 'bg-[hsl(var(--primary))]'}`} /><div><div className="text-xs font-bold">{gap.title}</div><div className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{gap.recommendation}</div><div className="mt-1 font-data text-[9px] uppercase text-[hsl(var(--muted-foreground))]">{gap.reference} • {gap.severity}</div></div></div>;
}

function AuditPage() {
  const compliance = useRunComplianceCheck();
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [form, setForm] = useState({ 
    builderName: '', 
    buildingName: '', 
    rampSlope: '8.33', 
    doorWidth: '900', 
    liftAvailable: true, 
    accessibleRestrooms: true, 
    tactilePath: false, 
    blueprintName: '',
    accessibleParking: true,
    signageContrast: true,
    emergencyRefuge: false,
    inductionLoop: false,
    washroomAlarmCord: true
  });
  
  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  
  const submit = (event: FormEvent) => { 
    event.preventDefault(); 
    const data: ComplianceInput = { 
      builderName: form.builderName, 
      buildingName: form.buildingName, 
      rampSlope: Number(form.rampSlope), 
      doorWidth: Number(form.doorWidth), 
      liftAvailable: form.liftAvailable, 
      accessibleRestrooms: form.accessibleRestrooms, 
      tactilePath: form.tactilePath, 
      ...(form.blueprintName ? { blueprintName: form.blueprintName } : {}) 
    }; 
    compliance.mutate({ data }, { 
      onSuccess: (res) => {
        // Enrich report score with extra architectural checks
        let extraScoreDeduction = 0;
        const extraGaps: Gap[] = [];
        
        if (!form.accessibleParking) {
          extraScoreDeduction += 8;
          extraGaps.push({
            id: 'gap-parking',
            title: 'Dedicated 3.6m Accessible Parking Slot Missing',
            severity: 'moderate',
            reference: 'NBC 2016 · 4.2.1',
            recommendation: 'Reserve at least 2 parking slots near the entry with international symbol and 3.6m width.'
          });
        }
        if (!form.emergencyRefuge) {
          extraScoreDeduction += 12;
          extraGaps.push({
            id: 'gap-refuge',
            title: 'Fire-safe Emergency Refuge Zone Missing',
            severity: 'critical',
            reference: 'NBC 2016 · 4.8.2',
            recommendation: 'Provide a fire-rated refuge area on upper floors with 2-way intercom.'
          });
        }
        if (!form.washroomAlarmCord) {
          extraScoreDeduction += 6;
          extraGaps.push({
            id: 'gap-alarm',
            title: 'Washroom Emergency Pull-Cord Alarm Missing',
            severity: 'moderate',
            reference: 'RPwD Act · Schedule 2',
            recommendation: 'Install emergency pull-cords at 300mm and 900mm heights inside accessible washrooms.'
          });
        }

        const finalScore = Math.max(10, res.score - extraScoreDeduction);
        const finalReport: ComplianceReport = {
          ...res,
          score: finalScore,
          rating: Number((1 + finalScore / 25).toFixed(1)),
          gaps: [...res.gaps, ...extraGaps]
        };
        setReport(finalReport);
      } 
    }); 
  };

  return <div>
    <PageHeader eyebrow="Architect's Compliance Workspace" title={<>Check the layout<br /><span className="text-[hsl(var(--primary))]">before building.</span></>} description="Quickly test your blueprint dimensions and structural facilities against official NBC 2016 and RPwD Act standards before submission." />
    <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-8 md:px-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-7">
        <div className="mb-7 flex items-center gap-3 border-b border-[hsl(var(--border))] pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
            <FileCheck2 size={18} />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Structural &amp; Facility Inputs</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">All parameters are checked against NBC 2016 &amp; Harmonised Guidelines.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Builder / Organisation" value={form.builderName} onChange={(v) => update('builderName', v)} placeholder="e.g. CPWD regional office" testId="input-builder-name" required />
          <Field label="Building Name" value={form.buildingName} onChange={(v) => update('buildingName', v)} placeholder="e.g. Ward office, Sector 12" testId="input-building-name" required />
          <Field label="Entry Ramp Slope" suffix="%" type="number" value={form.rampSlope} onChange={(v) => update('rampSlope', v)} testId="input-ramp-slope" required />
          <Field label="Clear Door Opening Width" suffix="mm" type="number" value={form.doorWidth} onChange={(v) => update('doorWidth', v)} testId="input-door-width" required />
        </div>

        <div className="mt-6">
          <label htmlFor="blueprint" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--primary)/.45)] bg-[hsl(var(--secondary)/.32)] p-5 text-center transition-colors hover:bg-[hsl(var(--secondary))]">
            <FileUp size={22} className="text-[hsl(var(--primary))]" />
            <span className="mt-2 text-xs font-bold">{form.blueprintName || 'Attach Blueprint Reference (DWG, PDF, Plan)'}</span>
            <span className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">PDF, DWG or image • optional for rule verification</span>
            <input id="blueprint" type="file" className="sr-only" data-testid="input-blueprint" onChange={(event) => update('blueprintName', event.target.files?.[0]?.name ?? '')} />
          </label>
        </div>

        <div className="mt-7 space-y-3.5 border-t border-[hsl(var(--border))] pt-6">
          <h3 className="font-display text-sm font-bold text-[hsl(var(--primary))] mb-3 uppercase tracking-wider">Access Provisions Checklist</h3>
          <Toggle label="Lift available and operational with Braille & Voice" checked={form.liftAvailable} onChange={(v) => update('liftAvailable', v)} testId="toggle-lift" />
          <Toggle label="Accessible restroom on every public floor" checked={form.accessibleRestrooms} onChange={(v) => update('accessibleRestrooms', v)} testId="toggle-restrooms" />
          <Toggle label="Continuous tactile guidance path from entry" checked={form.tactilePath} onChange={(v) => update('tactilePath', v)} testId="toggle-tactile" />
          <Toggle label="Dedicated 3.6m Accessible Parking Slot near entrance" checked={form.accessibleParking} onChange={(v) => update('accessibleParking', v)} testId="toggle-parking" />
          <Toggle label="High-Contrast signage with tactile Braille (1.4m - 1.6m)" checked={form.signageContrast} onChange={(v) => update('signageContrast', v)} testId="toggle-signage" />
          <Toggle label="Fire Evacuation Safe Refuge Zone with 2-way intercom" checked={form.emergencyRefuge} onChange={(v) => update('emergencyRefuge', v)} testId="toggle-refuge" />
          <Toggle label="Hearing Induction Loop at help desk / reception" checked={form.inductionLoop} onChange={(v) => update('inductionLoop', v)} testId="toggle-induction" />
          <Toggle label="Washroom emergency pull-cord alarm (at 300mm & 900mm)" checked={form.washroomAlarmCord} onChange={(v) => update('washroomAlarmCord', v)} testId="toggle-alarm" />
        </div>

        <button disabled={compliance.isPending} type="submit" data-testid="button-run-compliance" className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70">
          {compliance.isPending ? <><Loader2 size={16} className="animate-spin" />Checking blueprint dimensions…</> : <><ShieldCheck size={16} />Run Structural Compliance Audit</>}
        </button>
        {compliance.isError && <p data-testid="text-compliance-error" className="mt-3 text-center text-xs text-[#a53f3a]">The checker could not complete. Please review your inputs and try again.</p>}
      </form>

      <div className="lg:pt-1">
        {report ? <div className="animate-rise">
          <div className="mb-3 font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">Audit Report / Result</div>
          <ComplianceReportCard report={report} />
          <button type="button" onClick={() => setReport(null)} data-testid="button-new-compliance" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-xs font-bold hover:bg-[hsl(var(--secondary))]">
            <ClipboardCheck size={15} />Check Another Building Blueprint
          </button>
        </div> : <InfoPanel title="What this checks" icon={<ShieldCheck size={20} />} items={[
          'Ramp slope at or below 1:12 (8.33%)',
          'Clear door width (minimum 900 mm)',
          'Accessible elevator & Braille controls',
          'Restroom turning radius & emergency alarm cords',
          'Dedicated 3.6m PwD parking slots',
          'Fire evacuation refuge zone provision'
        ]} />}
      </div>
    </div>
  </div>;
}

function Field({ label, value, onChange, placeholder, suffix, type = 'text', required, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; suffix?: string; type?: string; required?: boolean; testId: string }) {
  const inputId = testId + '-input';
  return <div className="block text-xs font-bold">
    <label htmlFor={inputId} className="block mb-2">{label}{required && <span className="ml-1 text-[#b74740]">*</span>}</label>
    <div className="relative">
      <input id={inputId} required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} data-testid={testId} className="h-11 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm font-medium outline-none placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]" />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-data text-[10px] text-[hsl(var(--muted-foreground))]">{suffix}</span>}
    </div>
  </div>;
}

function Toggle({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (value: boolean) => void; testId: string }) {
  const switchId = testId + '-switch';
  const labelId = testId + '-label';
  return <div className="flex items-center justify-between gap-4 text-sm font-semibold">
    <span id={labelId}>{label}</span>
    <button id={switchId} type="button" role="switch" aria-checked={checked} aria-labelledby={labelId} onClick={() => onChange(!checked)} data-testid={testId} className={`relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted-foreground)/.35)]'}`}>
      <span className="sr-only">{label}</span>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-[hsl(var(--card))] shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>;
}

function InfoPanel({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return <div className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-civic"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{icon}</div><h2 className="mt-5 font-display text-2xl font-bold">{title}</h2><ul className="mt-5 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm text-[hsl(var(--muted-foreground))]"><Check size={16} className="mt-0.5 flex-none text-[#32805e]" />{item}</li>)}</ul><div className="mt-7 border-t border-[hsl(var(--border))] pt-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">The check follows the Harmonised Guidelines and Space Standards for Barrier-Free Built Environment.</div></div>;
}

function InspectionsPage() {
  const { buildings } = useMockDB();
  const submitAudit = useSubmitAudit();
  
  const [form, setForm] = useState<AuditInput>({ buildingId: '', auditorName: '', summary: '' });
  const [facilityTag, setFacilityTag] = useState("Main Entrance & Ramp");
  const [usabilityRating, setUsabilityRating] = useState("4");
  const [locationArea, setLocationArea] = useState("");
  const [recommendedFix, setRecommendedFix] = useState("");
  const [photoProofName, setPhotoProofName] = useState("");
  
  const [obstructions, setObstructions] = useState({
    rampBlocked: false,
    restroomLocked: false,
    elevatorDown: false,
    tactileBroken: false
  });

  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof AuditInput, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => { 
    event.preventDefault(); 
    const enrichedSummary = `[${facilityTag} | Rating: ${usabilityRating}/5 ${locationArea ? '| Area: ' + locationArea : ''}] ${form.summary} ${recommendedFix ? ' Recommended Fix: ' + recommendedFix : ''}`;
    submitAudit.mutate({ data: { ...form, summary: enrichedSummary } }, { onSuccess: () => setSubmitted(true) }); 
  };

  if (submitted) return <div className="mx-auto max-w-[720px] px-5 py-16 md:px-10"><div className="animate-rise rounded-2xl border border-[#b9d6c3] bg-[#edf7ef] p-8 text-center shadow-civic"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#32805e] text-white"><Check size={27} /></div><div className="mt-5 font-data text-[10px] uppercase tracking-[.18em] text-[#26734e]">Field Report Received</div><h1 className="mt-2 font-display text-4xl font-bold text-[#173b2c]">Thank you for making access visible.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#426b55]">Your field observation note has been added to the review queue. Verified observations help citizens plan their visit with confidence.</p><button type="button" onClick={() => { setSubmitted(false); setForm({ buildingId: '', auditorName: '', summary: '' }); setLocationArea(''); setRecommendedFix(''); }} data-testid="button-submit-another-audit" className="mt-7 rounded-lg bg-[#26734e] px-5 py-3 text-sm font-bold text-white">Submit another field report</button></div></div>;

  return <div>
    <PageHeader eyebrow="Community Field Reports" title={<>Help others with<br /><span className="text-[hsl(var(--primary))]">your observations.</span></>} description="Been there recently? Take a moment to share details about entrances, ramps, washrooms, and elevator facilities. Your direct experience helps the community visit safely." />
    
    <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-8 md:px-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-7">
        <div className="mb-7 border-b border-[hsl(var(--border))] pb-5">
          <div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">New observation</div>
          <h2 className="mt-1 font-display text-2xl font-bold">Field inspection report</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="block text-xs font-bold">
            <label htmlFor="select-audit-building" className="block mb-2">Building <span className="text-[#b74740]">*</span></label>
            <select id="select-audit-building" required value={form.buildingId} onChange={(event) => update('buildingId', event.target.value)} data-testid="select-audit-building" className="h-11 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]">
              <option value="">Select the building you visited</option>
              {buildings?.map((building: any) => <option key={building.id} value={building.id}>{building.name} — {building.address}</option>)}
            </select>
          </div>

          <Field label="Your Name or Organisation" value={form.auditorName} onChange={(value) => update('auditorName', value)} placeholder="e.g. Asha Rao, Access Now" testId="input-auditor-name" required />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="block text-xs font-bold">
            <label htmlFor="select-facility-tag" className="block mb-2">Inspection Category / Zone</label>
            <select id="select-facility-tag" value={facilityTag} onChange={(e) => setFacilityTag(e.target.value)} className="h-11 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]">
              <option>Main Entrance &amp; Ramp</option>
              <option>Restroom / Washroom</option>
              <option>Elevator / Lift</option>
              <option>Dedicated PwD Parking</option>
              <option>Tactile Pathway</option>
              <option>Wayfinding Signage</option>
              <option>Overall Building Facility</option>
            </select>
          </div>

          <div className="block text-xs font-bold">
            <label htmlFor="select-usability-rating" className="block mb-2">Accessibility Score / Usability</label>
            <select id="select-usability-rating" value={usabilityRating} onChange={(e) => setUsabilityRating(e.target.value)} className="h-11 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]">
              <option value="5">5 ★ - Fully Accessible &amp; Barrier-Free</option>
              <option value="4">4 ★ - Usable with Minor Signage Gaps</option>
              <option value="3">3 ★ - Moderate Barriers (Needs Assistance)</option>
              <option value="2">2 ★ - Significant Gaps (Ramp steep / No lift)</option>
              <option value="1">1 ★ - Inaccessible / Severe Barriers</option>
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Floor / Specific Location (Optional)" value={locationArea} onChange={setLocationArea} placeholder="e.g. Ground Floor East Wing, Room 102" testId="input-location-area" />
          
          <div className="block text-xs font-bold">
            <label htmlFor="input-photo-proof" className="block mb-2">Photo Evidence Proof (Optional)</label>
            <input id="input-photo-proof" type="file" onChange={(e) => setPhotoProofName(e.target.files?.[0]?.name || '')} className="text-xs text-muted-foreground file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]" />
            {photoProofName && <span className="text-[10px] text-green-700 font-bold mt-1 block">Attached: {photoProofName}</span>}
          </div>
        </div>

        {/* Quick Obstruction Flags */}
        <div className="mt-6 border-t border-[hsl(var(--border))] pt-5">
          <label className="block text-xs font-bold mb-3 text-[hsl(var(--primary))] uppercase tracking-wider">Observed Barrier Flags (Check all that apply)</label>
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer bg-[hsl(var(--background))] p-2.5 rounded-lg border">
              <input type="checkbox" checked={obstructions.rampBlocked} onChange={(e) => setObstructions({...obstructions, rampBlocked: e.target.checked})} />
              <span>Ramp blocked / excessively steep</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[hsl(var(--background))] p-2.5 rounded-lg border">
              <input type="checkbox" checked={obstructions.restroomLocked} onChange={(e) => setObstructions({...obstructions, restroomLocked: e.target.checked})} />
              <span>Accessible toilet locked / used as storage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[hsl(var(--background))] p-2.5 rounded-lg border">
              <input type="checkbox" checked={obstructions.elevatorDown} onChange={(e) => setObstructions({...obstructions, elevatorDown: e.target.checked})} />
              <span>Elevator non-functional / Braille missing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[hsl(var(--background))] p-2.5 rounded-lg border">
              <input type="checkbox" checked={obstructions.tactileBroken} onChange={(e) => setObstructions({...obstructions, tactileBroken: e.target.checked})} />
              <span>Tactile guidance broken or missing</span>
            </label>
          </div>
        </div>

        <div className="mt-5 block text-xs font-bold">
          <label htmlFor="textarea-audit-summary" className="block mb-2">Detailed Observations <span className="text-[#b74740]">*</span></label>
          <textarea id="textarea-audit-summary" required minLength={1} value={form.summary} onChange={(event) => update('summary', event.target.value)} data-testid="textarea-audit-summary" placeholder="Describe the entrance, routes, turning clearance, grab rails, or barriers encountered…" className="min-h-28 w-full resize-y rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-3 text-sm leading-6 outline-none placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]" />
        </div>

        <div className="mt-4 block text-xs font-bold">
          <label htmlFor="input-recommended-fix" className="block mb-2">Actionable Recommendation for Building Manager (Optional)</label>
          <input id="input-recommended-fix" value={recommendedFix} onChange={(e) => setRecommendedFix(e.target.value)} placeholder="e.g. Clear storage boxes from washroom; Add rubber slope mat to entrance step" className="h-11 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]" />
        </div>

        {submitAudit.isError && <p data-testid="text-audit-error" className="mt-3 text-xs text-[#a53f3a]">This report could not be submitted. Please try again.</p>}
        
        <button disabled={submitAudit.isPending} type="submit" data-testid="button-submit-audit" className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:opacity-70">
          {submitAudit.isPending ? <><Loader2 size={16} className="animate-spin" />Submitting report…</> : <><Send size={16} />Publish Field Inspection Report</>}
        </button>
      </form>

      <div>
        <InfoPanel title="A useful note is specific" icon={<Footprints size={20} />} items={[
          'Specify the exact zone (e.g. Main Ramp, West Elevator)',
          'Note clearances (door width, turning radius in washrooms)',
          'Check if emergency pull-cords & grab rails are present',
          'Suggest actionable fixes for building authorities',
          'Upload photo evidence to validate the inspection'
        ]} />
      </div>
    </div>
  </div>;
}

// ----------------------------------------------------
// NEW PAGE: HELPLINES DIRECTORY
// ----------------------------------------------------
function HelplinesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = useMemo(() => {
    return HELPLINE_DIRECTORY.filter(h => 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.tags.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.authority.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return <div>
    <PageHeader eyebrow="Safety Directory" title={<>Emergency &amp; Support<br /><span className="text-[hsl(var(--primary))]">Helplines.</span></>} description="Browse and search verified helplines for immediate police assistance, mental health support, ambulance, and specialized query authorities." />
    <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-10">
      <div className="relative mb-8 max-w-xl">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search query (e.g. mental aid, ambulance, police)..." className="h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, idx) => (
          <div key={idx} className="border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-5 shadow-civic flex flex-col justify-between">
            <div>
              <div className="font-data text-[9px] uppercase tracking-wider text-[hsl(var(--primary))] font-bold">{item.authority}</div>
              <h3 className="font-display text-lg font-bold mt-1.5">{item.name}</h3>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="font-mono text-xl font-extrabold text-[hsl(var(--accent-foreground))] bg-[hsl(var(--accent))] px-2.5 py-1 rounded-lg">{item.number}</span>
              <a href={`tel:${item.number.split('/')[0].trim()}`} className="text-xs font-bold text-[hsl(var(--primary))] hover:underline flex items-center gap-1">Call Now <ChevronRight size={14} /></a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

// ----------------------------------------------------
// NEW PAGE: COMPLAINTS PIPELINE & TRACKING
// ----------------------------------------------------
function ComplaintsPage() {
  const { complaints, addComplaint, updateComplaintStatus, buildings, profile } = useMockDB();
  const [selectedBldg, setSelectedBldg] = useState("");
  const [category, setCategory] = useState("Ramp Slope");
  const [details, setDetails] = useState("");
  
  // Officer mock work variables
  const [selectedComplaintId, setSelectedComplaintId] = useState("");
  const [dismissReason, setDismissReason] = useState("");

  const activeStrikes = profile.fakeStrikes || 0;
  const isLockedOut = activeStrikes >= 3;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLockedOut) {
      alert("Registration locked out: You have exceeded the penalty limit of 3 fake complaints.");
      return;
    }
    const bldgName = buildings.find(b => b.id === selectedBldg)?.name || "Public Facility";
    const newComp = {
      id: `COMP-${Date.now().toString().slice(-4)}`,
      buildingId: selectedBldg,
      buildingName: bldgName,
      category,
      details,
      status: "Submitted",
      officer: "Officer Devendra Varma, HUD",
      dismissReason: "",
      filedBy: profile.name || "Asha Rao",
      submittedAt: new Date().toISOString()
    };
    addComplaint(newComp);
    setSelectedBldg("");
    setDetails("");
    alert("Complaint registered. Assigned to Officer Devendra Varma for inspection.");
  };

  // Simulated Officer resolution or dismissal
  const handleOfficerAction = (status: "Resolved" | "Dismissed") => {
    if (!selectedComplaintId) return;
    if (status === "Dismissed" && !dismissReason.trim()) {
      alert("A valid dismiss reason must be provided by the officer for transparency.");
      return;
    }
    updateComplaintStatus(selectedComplaintId, status, dismissReason);
    setSelectedComplaintId("");
    setDismissReason("");
    alert(`Complaint has been marked as ${status}.`);
  };

  return <div>
    <PageHeader eyebrow="Accountability Portal" title={<>Transparent Complaint<br /><span className="text-[hsl(var(--primary))]">Remediation Pipeline.</span></>} description="Track accessibility complaints step-by-step just like tracking an online delivery. Clear assignments encourage civic accountability." />
    
    <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-10 grid gap-8 lg:grid-cols-[1fr_380px]">
      
      {/* Active complaints tracking */}
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Active Investigations</h2>
        
        {complaints.length === 0 ? <p className="text-sm text-muted-foreground">No active complaints found.</p> : complaints.map((c) => {
          const steps = ["Submitted", "Assigned", "In Progress", c.status === "Dismissed" ? "Dismissed" : "Resolved"];
          const currentStepIdx = c.status === "Submitted" ? 0 : c.status === "Assigned" ? 1 : c.status === "In Progress" ? 2 : 3;

          return (
            <div key={c.id} className="border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-5 shadow-civic">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="font-data text-[9px] uppercase tracking-wider text-muted-foreground">ID: {c.id} · Filed by {c.filedBy}</span>
                  <h3 className="font-display text-lg font-bold mt-1">{c.buildingName}</h3>
                  <p className="text-xs text-[hsl(var(--primary))] font-semibold mt-1">Issue: {c.category}</p>
                  <p className="text-xs text-muted-foreground mt-2">{c.details}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${c.status === 'Resolved' ? 'bg-green-100 text-green-700' : c.status === 'Dismissed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
              </div>

              {/* Progress pipeline (shipping tracker style) */}
              <div className="mt-6 border-t border-[hsl(var(--border))] pt-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                  {steps.map((st, idx) => (
                    <div key={st} className="flex flex-col items-center flex-1 relative">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 mb-1.5 z-10 bg-[hsl(var(--card))] ${idx <= currentStepIdx ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))] font-black' : 'border-gray-300'}`}>
                        {idx < currentStepIdx ? "✓" : idx === currentStepIdx ? "●" : idx + 1}
                      </div>
                      <span className={idx === currentStepIdx ? 'text-[hsl(var(--primary))]' : ''}>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 bg-[hsl(var(--secondary)/.3)] p-3 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Assigned Officer</div>
                  <div className="font-bold flex items-center gap-1"><Shield size={13} className="text-[hsl(var(--primary))]" /> {c.officer}</div>
                </div>
                {c.dismissReason && (
                  <div className="text-right border-l pl-3 ml-3 max-w-xs">
                    <div className="text-[10px] text-red-600 uppercase font-bold">Dismissal Reason</div>
                    <div className="italic text-red-800 font-semibold">{c.dismissReason}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Complaint submission & simulated officer actions */}
      <div className="space-y-6">
        
        {/* File Complaint Form */}
        <div className="border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-5 shadow-civic">
          <h3 className="font-display text-lg font-bold mb-4">File Accessibility Complaint</h3>
          
          {isLockedOut ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-xs font-semibold">
              <AlertOctagon className="mb-2" /> WARNING: File submission blocked. You have been penalized for exceeding the limit of 3 fake complaints. Contact support for audit reviews.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Select Building</label>
                <select required value={selectedBldg} onChange={(e) => setSelectedBldg(e.target.value)} className="w-full h-10 border rounded-lg px-2 text-xs">
                  <option value="">Choose a building</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Issue Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 border rounded-lg px-2 text-xs">
                  <option>Ramp Slope</option>
                  <option>Washroom Clearance</option>
                  <option>Lift Braille Keys</option>
                  <option>Tactile Pathway</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Details / Barriers Encountered</label>
                <textarea required value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe accessibility gaps clearly..." className="w-full min-h-20 border rounded-lg p-2 text-xs" />
              </div>
              <button type="submit" className="w-full bg-[hsl(var(--primary))] text-white rounded-lg h-10 text-xs font-bold">Register Complaint</button>
            </form>
          )}
        </div>

        {/* Officer Workspace Simulator (for demoing accountability/strikes) */}
        {profile.role === 'officer' && (
          <div className="border border-[hsl(var(--accent))] bg-[hsl(var(--secondary)/.2)] rounded-xl p-5 shadow-civic">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="text-[hsl(var(--primary))]" />
              <h3 className="font-display text-sm font-bold">Officer Workspace Simulator</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">Simulate resolving or dismissing a complaint. Dismissals tagged with 'fake' increase the user's strikes.</p>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Complaint ID</label>
                <select value={selectedComplaintId} onChange={(e) => setSelectedComplaintId(e.target.value)} className="w-full h-9 border rounded-lg px-2 text-xs bg-white">
                  <option value="">Choose complaint</option>
                  {complaints.filter(c => c.status !== "Resolved" && c.status !== "Dismissed").map(c => (
                    <option key={c.id} value={c.id}>{c.id} - {c.buildingName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Action Reason (Mandatory if dismissing)</label>
                <input value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} placeholder="e.g. Verified fake complaint / Resolved ramp rebuilt" className="w-full h-9 border rounded-lg px-2 text-xs bg-white" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleOfficerAction("Resolved")} className="flex-1 bg-green-600 text-white rounded h-8 text-xs font-bold">Resolve</button>
                <button onClick={() => handleOfficerAction("Dismissed")} className="flex-1 bg-red-600 text-white rounded h-8 text-xs font-bold">Dismiss</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  </div>;
}

// ----------------------------------------------------
// NEW PAGE: VOLUNTEERING & DONATIONS
// ----------------------------------------------------
function VolunteeringPage() {
  const { volunteers, addVolunteerBooking } = useMockDB();
  const [selectedNGO, setSelectedNGO] = useState(INITIAL_NGOs[0].id);
  const [bookingDate, setBookingDate] = useState("");
  const [specialOccasion, setSpecialOccasion] = useState("");
  const [volunteerTask, setVolunteerTask] = useState("");
  
  // Donation state
  const [donateAmount, setDonateAmount] = useState("500");

  const ngo = INITIAL_NGOs.find(n => n.id === selectedNGO) || INITIAL_NGOs[0];

  const handleBook = (e: FormEvent) => {
    e.preventDefault();
    addVolunteerBooking({
      id: `VOL-${Date.now()}`,
      ngoName: ngo.name,
      ngoType: ngo.type,
      date: bookingDate,
      task: volunteerTask || ngo.tasks[0],
      occasion: specialOccasion
    });
    setBookingDate("");
    setSpecialOccasion("");
    alert("Volunteering slot booked successfully!");
  };

  const handleDonate = (e: FormEvent) => {
    e.preventDefault();
    alert(`Thank you! Simulated payment of ₹${donateAmount} received for ${ngo.name}.`);
  };

  return <div>
    <PageHeader eyebrow="Community Action" title={<>Spend Special Occasions<br /><span className="text-[hsl(var(--primary))]">Helping Others.</span></>} description="Book slots to spend birthdays or anniversaries with residents in old age homes (Vrudhashrams), orphanages, and schools, or support them with donations." />
    
    <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-10 grid gap-8 lg:grid-cols-[1fr_400px]">
      
      {/* Book volunteer slot & donation */}
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Volunteer &amp; Donation Hub</h2>
        
        <div className="border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-5 shadow-civic">
          <h3 className="font-display text-lg font-bold mb-4">Book Occasion Slot / Volunteer Work</h3>
          
          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Select Institution / NGO</label>
              <select value={selectedNGO} onChange={(e) => setSelectedNGO(e.target.value)} className="w-full h-10 border rounded-lg px-2 text-xs">
                {INITIAL_NGOs.map(n => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold mb-1">Date</label>
                <input required type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full h-10 border rounded-lg px-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Special Occasion (Optional)</label>
                <input type="text" value={specialOccasion} onChange={(e) => setSpecialOccasion(e.target.value)} placeholder="e.g. Birthday, Anniversary" className="w-full h-10 border rounded-lg px-2 text-xs" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Task Assignment</label>
              <select value={volunteerTask} onChange={(e) => setVolunteerTask(e.target.value)} className="w-full h-10 border rounded-lg px-2 text-xs">
                {ngo.tasks.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[hsl(var(--primary))] text-white rounded-lg h-11 text-xs font-bold flex items-center justify-center gap-1">
              <Calendar size={15} /> Book Booking Slot
            </button>
          </form>
        </div>

        {/* Donations Panel */}
        <div className="border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-5 shadow-civic">
          <h3 className="font-display text-lg font-bold mb-2">Donate Funds</h3>
          <p className="text-xs text-muted-foreground mb-4">Support {ngo.name} directly. Donations are tax-deductible.</p>
          <form onSubmit={handleDonate} className="flex gap-3">
            <input required type="number" value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} className="w-1/2 h-10 border rounded-lg px-3 text-xs" placeholder="Amount (INR)" />
            <button type="submit" className="flex-1 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-lg h-10 text-xs font-bold flex items-center justify-center gap-1">
              <Gift size={15} /> Donate Now
            </button>
          </form>
        </div>
      </div>

      {/* Booked Slots Sidebar */}
      <div className="space-y-6">
        <h2 className="font-display text-xl font-bold">Your Bookings</h2>
        
        {volunteers.length === 0 ? (
          <div className="border border-dashed rounded-xl p-6 text-center text-xs text-muted-foreground">
            No occasions booked yet. Make someone's day special!
          </div>
        ) : (
          volunteers.map((v) => (
            <div key={v.id} className="border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-4 shadow-civic">
              <div className="font-data text-[9px] uppercase tracking-wider text-[hsl(var(--primary))] font-bold">{v.ngoType}</div>
              <h4 className="font-bold text-sm mt-1">{v.ngoName}</h4>
              <p className="text-xs text-muted-foreground mt-2">Date: <strong>{new Date(v.date).toLocaleDateString('en-IN')}</strong></p>
              <p className="text-xs text-muted-foreground">Task: <strong>{v.task}</strong></p>
              {v.occasion && <span className="inline-block mt-3 bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Occasion: {v.occasion}</span>}
            </div>
          ))
        )}
      </div>

    </div>
  </div>;
}

// ----------------------------------------------------
// NEW PAGE: SAFE SPOTS DIRECTORY
// ----------------------------------------------------
function SafeSpotsPage() {
  const { safeSpots } = useMockDB();
  return <div>
    <PageHeader eyebrow="Safety Protocols" title={<>Your Shortcut<br /><span className="text-[hsl(var(--primary))]">Safe Spots.</span></>} description="Quickly access safe zones, refuge rooms, and fire escapes inside complex buildings. These spots are pre-saved for instant retrieval during emergencies." />
    <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {safeSpots.map((item) => (
          <div key={item.id} className="border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-5 shadow-civic">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-display text-lg font-bold">{item.name}</h3>
            <p className="text-xs text-muted-foreground mt-2">{item.note}</p>
            <div className="mt-6 border-t border-[hsl(var(--border))] pt-3 flex justify-between items-center text-[10px] font-bold text-[hsl(var(--primary))]">
              <span>Evacuation Zone</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Secure</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

// ----------------------------------------------------
// NEW PAGE: BUDDY SYSTEM (FIND A BUDDY)
// ----------------------------------------------------
function BuddyPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [buddies, setBuddies] = useState([
    { name: "Rahul Sharma", role: "NGO Volunteer", dist: "45m away", icon: User },
    { name: "Srinivas Rao", role: "Security Personnel", dist: "12m away", icon: Shield },
    { name: "Amrita Patel", role: "Nearby Citizen Buddy", dist: "80m away", icon: Users }
  ]);
  const [seekingBuddy, setSeekingBuddy] = useState(false);

  const triggerSeekBuddy = () => {
    setSeekingBuddy(true);
    setTimeout(() => {
      alert("Buddy Request sent! Rahul Sharma is responding and moving to your location.");
      setSeekingBuddy(false);
    }, 4000);
  };

  return <div>
    <PageHeader eyebrow="Mutual Aid" title={<>Find a Nearby Buddy<br /><span className="text-[hsl(var(--primary))]">for Assistance.</span></>} description="Notify nearby volunteers, security personnel, or community buddies if you require manual navigation assistance, ramp support, or guidance." />
    
    <div className="mx-auto max-w-[760px] px-5 py-8 md:px-10">
      <div className="border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-6 shadow-civic text-center">
        <Users size={40} className="mx-auto mb-4 text-[hsl(var(--primary))]" />
        <h3 className="font-display text-xl font-bold">Seek Assistance Now</h3>
        <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">Clicking below sends a silent notification with your location to verified nearby users and volunteers.</p>
        
        <button 
          onClick={triggerSeekBuddy} 
          disabled={seekingBuddy}
          className="mt-6 inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white font-bold px-6 py-3.5 rounded-xl text-sm shadow-md disabled:opacity-75"
        >
          {seekingBuddy ? <Loader2 className="animate-spin" /> : <Users size={16} />}
          {seekingBuddy ? "Broadcasting to nearest buddies..." : "Broadcast Buddy Request"}
        </button>
      </div>

      <div className="mt-8">
        <h3 className="font-display text-lg font-bold mb-4">Nearby Active Buddies</h3>
        <div className="space-y-3">
          {buddies.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex justify-between items-center border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] rounded-xl p-4 shadow-civic">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--primary))]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{b.name}</h4>
                    <p className="text-xs text-muted-foreground">{b.role}</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">{b.dist}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={Dashboard} />
    <Route path="/buildings/:id" component={DetailPage} />
    <Route path="/audit" component={AuditPage} />
    <Route path="/inspections" component={InspectionsPage} />
    <Route path="/helplines" component={HelplinesPage} />
    <Route path="/complaints" component={ComplaintsPage} />
    <Route path="/volunteering" component={VolunteeringPage} />
    <Route path="/safe-spots" component={SafeSpotsPage} />
    <Route path="/buddy" component={BuddyPage} />
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><Router /></Shell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;