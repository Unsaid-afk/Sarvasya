import { Router, type IRouter } from "express";
import {
  GetBuildingParams,
  GetBuildingResponse,
  GetDashboardSummaryResponse,
  ListBuildingsQueryParams,
  ListBuildingsResponse,
} from "@workspace/api-zod";

export type AuditHistoryItem = {
  id: string;
  auditorName: string;
  submittedAt: string;
  status: "verified" | "pending" | "rejected" | "delayed";
  score?: number;
  summary: string;
  gaps?: Array<{
    id: string;
    title: string;
    severity: "critical" | "moderate" | "minor";
    reference: string;
    recommendation: string;
  }>;
  observations?: string;
};

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
  category: "hospital" | "government" | "library";
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
    status: "verified" | "pending" | "rejected";
    summary: string;
  };
  auditHistory?: AuditHistoryItem[];
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

// The canonical building data lives in ../lib/db.ts (JSON file store).
import { getDB, getBuildings } from "../lib/db";

const router: IRouter = Router();

// Helper to calculate dynamic status
function getDynamicStatus(building: BuildingRecord, complaints: any[]) {
  const openComplaints = complaints.filter(c => 
    c.buildingId === building.id && 
    ["Submitted", "Assigned", "In Progress"].includes(c.status)
  ).length;

  if (openComplaints >= 3) return "red";
  if (openComplaints > 0) return "amber";
  return building.status;
}

router.get("/buildings", (req, res): void => {
  const parsed = ListBuildingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const query = parsed.data.query?.toLowerCase().trim();
  const status = parsed.data.status;
  const db = getDB();
  
  const result = db.buildings.map(b => ({ ...b, status: getDynamicStatus(b, db.complaints) })).filter((building) => {
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
  const db = getDB();
  let building = db.buildings.find((item) => item.id === params.data.id);
  if (!building) {
    res.status(404).json({ error: "Building not found" });
    return;
  }
  building = { ...building, status: getDynamicStatus(building, db.complaints) };
  res.json(GetBuildingResponse.parse(building));
});

router.get("/dashboard/summary", (_req, res): void => {
  const currentBuildings = getBuildings();
  const result = {
    buildings: currentBuildings.length,
    verified: currentBuildings.filter((building) => building.audit.status === "verified").length,
    openGaps: currentBuildings.reduce((count, building) => count + building.report.gaps.length, 0),
    averageRating: Number((currentBuildings.reduce((sum, building) => sum + building.rating, 0) / currentBuildings.length).toFixed(1)),
    updatedAt: new Date().toISOString(),
  };
  res.json(GetDashboardSummaryResponse.parse(result));
});

export default router;