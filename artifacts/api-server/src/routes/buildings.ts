import { Router, type IRouter } from "express";
import {
  GetBuildingParams,
  GetBuildingResponse,
  GetDashboardSummaryResponse,
  ListBuildingsQueryParams,
  ListBuildingsResponse,
} from "@workspace/api-zod";

export type BuildingRecord = {
  id: string;
  name: string;
  address: string;
  builder: string;
  rating: number;
  status: "green" | "amber" | "red";
  lastAudit: string;
  accessibleFeatures: string[];
  coordinates: { lat: number; lng: number };
  report: {
    score: number;
    rating: number;
    summary: string;
    gaps: Array<{
      id: string;
      title: string;
      severity: "critical" | "moderate" | "minor";
      reference: string;
      recommendation: string;
    }>;
    checkedAt: string;
  };
  auditor: string;
  audit: {
    id: string;
    auditorName: string;
    submittedAt: string;
    status: "verified" | "pending";
    summary: string;
  };
  wayfinding: Array<{
    id: string;
    label: string;
    type: string;
    status: "open" | "limited" | "closed";
    x: number;
    y: number;
    note: string;
  }>;
};

export const buildings: BuildingRecord[] = [
  {
    id: "vidhan-bhavan",
    name: "Vidhan Bhavan Public Services",
    address: "Nariman Point, Mumbai, Maharashtra",
    builder: "Maharashtra Public Works",
    rating: 4.7,
    status: "green",
    lastAudit: "12 Jun 2026",
    accessibleFeatures: ["Step-free entry", "Tactile path", "Induction loop", "Accessible restroom"],
    coordinates: { lat: 18.925, lng: 72.823 },
    auditor: "AccessWorks India",
    report: {
      score: 94,
      rating: 4.7,
      summary: "Strong alignment with RPwD Act and National Building Code requirements. One minor signage gap remains.",
      checkedAt: "12 Jun 2026",
      gaps: [
        {
          id: "gap-signage",
          title: "Wayfinding signage contrast",
          severity: "minor",
          reference: "NBC 2016 · 4.3.2",
          recommendation: "Increase luminance contrast on the second-floor directional signs.",
        },
      ],
    },
    audit: {
      id: "audit-vb-01",
      auditorName: "AccessWorks India",
      submittedAt: "12 Jun 2026",
      status: "verified",
      summary: "On-site inspection confirms the AI report. Ramp landing, lift controls, and restroom clearances were measured and verified.",
    },
    wayfinding: [
      { id: "entrance", label: "Accessible entrance", type: "ramp", status: "open", x: 18, y: 71, note: "Proceed 12 metres to the tactile path." },
      { id: "lift", label: "Lift · Ground floor", type: "lift", status: "open", x: 55, y: 39, note: "Lift is operational. Voice announcements enabled." },
      { id: "restroom", label: "Accessible restroom", type: "restroom", status: "open", x: 76, y: 27, note: "Clearance verified at 1,550 mm." },
      { id: "help", label: "Help desk", type: "help", status: "open", x: 34, y: 29, note: "Staff assistance available." },
    ],
  },
  {
    id: "vadodara-civic-centre",
    name: "Vadodara Civic Centre",
    address: "Shivajinagar, Vadodara, Maharashtra",
    builder: "Vadodara Municipal Corporation",
    rating: 3.8,
    status: "amber",
    lastAudit: "28 May 2026",
    accessibleFeatures: ["Step-free entry", "Accessible parking", "Lift access"],
    coordinates: { lat: 18.531, lng: 73.844 },
    auditor: "Inclusive Routes Collective",
    report: {
      score: 76,
      rating: 3.8,
      summary: "The building is usable for most visitors, but tactile navigation and restroom turning clearances need attention.",
      checkedAt: "28 May 2026",
      gaps: [
        {
          id: "gap-tactile",
          title: "Continuous tactile guidance",
          severity: "critical",
          reference: "RPwD Act · Schedule 2",
          recommendation: "Connect the main entry to reception with a continuous tactile path.",
        },
        {
          id: "gap-restroom",
          title: "Restroom turning clearance",
          severity: "moderate",
          reference: "NBC 2016 · 4.5.4",
          recommendation: "Maintain a 1,500 mm turning circle inside the accessible restroom.",
        },
      ],
    },
    audit: {
      id: "audit-pcc-01",
      auditorName: "Inclusive Routes Collective",
      submittedAt: "28 May 2026",
      status: "verified",
      summary: "Field visit found an operational lift and compliant ramp. Two improvement items remain open from the inspection.",
    },
    wayfinding: [
      { id: "entrance", label: "Main ramp", type: "ramp", status: "open", x: 18, y: 71, note: "Ramp is open. Landing is slightly uneven." },
      { id: "lift", label: "Lift · Ground floor", type: "lift", status: "open", x: 55, y: 39, note: "Lift is operational." },
      { id: "restroom", label: "Accessible restroom", type: "restroom", status: "limited", x: 76, y: 27, note: "Use with assistance; turning clearance is limited." },
      { id: "help", label: "Citizen help desk", type: "help", status: "open", x: 34, y: 29, note: "Staff assistance available." },
    ],
  },
  {
    id: "koramangala-library",
    name: "Koramangala Community Library",
    address: "Koramangala, Bengaluru, Karnataka",
    builder: "Bengaluru Urban Development",
    rating: 2.9,
    status: "red",
    lastAudit: "04 Apr 2026",
    accessibleFeatures: ["Ground-floor service desk", "Accessible parking"],
    coordinates: { lat: 12.935, lng: 77.624 },
    auditor: "Open Access Bengaluru",
    report: {
      score: 58,
      rating: 2.9,
      summary: "Several critical access barriers were identified. The building is not yet independently navigable for wheelchair users.",
      checkedAt: "04 Apr 2026",
      gaps: [
        {
          id: "gap-ramp",
          title: "Ramp slope exceeds standard",
          severity: "critical",
          reference: "NBC 2016 · 4.1.3",
          recommendation: "Rebuild the entry ramp to a maximum 1:12 gradient with level landings.",
        },
        {
          id: "gap-lift",
          title: "No accessible vertical circulation",
          severity: "critical",
          reference: "RPwD Act · Section 41",
          recommendation: "Provide an accessible lift or relocate public services to the entry level.",
        },
        {
          id: "gap-doors",
          title: "Service door width",
          severity: "moderate",
          reference: "NBC 2016 · 4.4.1",
          recommendation: "Increase public-facing door clear width to at least 900 mm.",
        },
      ],
    },
    audit: {
      id: "audit-kcl-01",
      auditorName: "Open Access Bengaluru",
      submittedAt: "04 Apr 2026",
      status: "pending",
      summary: "Initial field report submitted. A follow-up verification is requested after the entry ramp remediation.",
    },
    wayfinding: [
      { id: "entrance", label: "Main entrance", type: "ramp", status: "limited", x: 18, y: 71, note: "Ramp is steep. Assistance recommended." },
      { id: "lift", label: "Lift", type: "lift", status: "closed", x: 55, y: 39, note: "No accessible lift is available." },
      { id: "restroom", label: "Ground-floor restroom", type: "restroom", status: "limited", x: 76, y: 27, note: "Clearance is not verified." },
      { id: "help", label: "Service desk", type: "help", status: "open", x: 34, y: 29, note: "Ask staff for assistance." },
    ],
  },
];

import { getBuildings } from "../lib/db";

const router: IRouter = Router();

router.get("/buildings", (req, res): void => {
  const parsed = ListBuildingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const query = parsed.data.query?.toLowerCase().trim();
  const status = parsed.data.status;
  const currentBuildings = getBuildings();
  const result = currentBuildings.filter((building) => {
    const matchesQuery = !query || `${building.name} ${building.address}`.toLowerCase().includes(query);
    const matchesStatus = !status || status === "all" || building.status === status;
    return matchesQuery && matchesStatus;
  });
  res.json(ListBuildingsResponse.parse(result));
});

router.get("/buildings/:id", (req, res): void => {
  const params = GetBuildingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const currentBuildings = getBuildings();
  const building = currentBuildings.find((item) => item.id === params.data.id);
  if (!building) {
    res.status(404).json({ error: "Building not found" });
    return;
  }
  res.json(GetBuildingResponse.parse(building));
});

router.get("/dashboard/summary", (_req, res): void => {
  const currentBuildings = getBuildings();
  const result = {
    buildings: currentBuildings.length,
    verified: currentBuildings.filter((building) => building.audit.status === "verified").length,
    openGaps: currentBuildings.reduce((count, building) => count + building.report.gaps.length, 0),
    averageRating: Number((currentBuildings.reduce((sum, building) => sum + building.rating, 0) / currentBuildings.length).toFixed(1)),
    updatedAt: "2026-08-08T09:42:00+05:30",
  };
  res.json(GetDashboardSummaryResponse.parse(result));
});

export default router;