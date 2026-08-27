const fs = require('fs');

const path = 'C:/Users/aarya/Desktop/work/accessibility yi/Asset-Manager/Asset-Manager/artifacts/sugamya-setu/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const correctTop = `import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useGetBuilding, useGetDashboardSummary, useListBuildings, useRunComplianceCheck, useSubmitAudit, 
  useListComplaints, useListNGOs, useListVolunteerBookings, useListSafeSpots,
  useSubmitComplaint, useUpdateComplaintStatus, useCreateVolunteerBooking, useCreateSafeSpot,
  useGetUserStrikes,
  getGetBuildingQueryKey, getGetDashboardSummaryQueryKey, getListBuildingsQueryKey 
} from '@workspace/api-client-react';
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

`;

// Find where `// Global state hooks replaced by React Query API wrappers` is and replace everything before it
const hookIndex = content.indexOf('// Global state hooks replaced by React Query API wrappers');
content = correctTop + content.substring(hookIndex);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed top of file');
