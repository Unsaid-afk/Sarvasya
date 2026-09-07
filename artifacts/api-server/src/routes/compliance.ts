import { Router, type IRouter } from "express";
import {
  RunComplianceCheckBody,
  RunComplianceCheckResponse,
  SubmitAuditBody,
  SubmitAuditResponse,
} from "@workspace/api-zod";
import { getDB, saveDB, getBuildings, saveBuildings, type AuditRecord } from "../lib/db";

const router: IRouter = Router();

router.post("/compliance/check", (req, res): void => {
  const parsed = RunComplianceCheckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const gaps = [];
  if (input.rampSlope > 8.33) {
    gaps.push({
      id: "ramp-slope",
      title: "Ramp slope exceeds 1:12 standard",
      severity: "critical" as const,
      reference: "NBC 2016 · 4.1.3",
      recommendation: "Revise the ramp to a maximum gradient of 8.33% with level landings.",
    });
  }
  if (input.doorWidth < 900) {
    gaps.push({
      id: "door-width",
      title: "Clear door width is below 900 mm",
      severity: "moderate" as const,
      reference: "NBC 2016 · 4.4.1",
      recommendation: "Provide a minimum clear opening of 900 mm on the accessible route.",
    });
  }
  if (!input.liftAvailable) {
    gaps.push({
      id: "lift",
      title: "Accessible vertical circulation is missing",
      severity: "critical" as const,
      reference: "RPwD Act · Section 41",
      recommendation: "Provide an accessible lift or keep all public services on the entry level.",
    });
  }
  if (!input.accessibleRestrooms) {
    gaps.push({
      id: "restroom",
      title: "Accessible restroom is not provided",
      severity: "moderate" as const,
      reference: "NBC 2016 · 4.5.4",
      recommendation: "Provide a restroom with grab rails, outward opening door, and 1,500 mm turning circle.",
    });
  }
  if (!input.tactilePath) {
    gaps.push({
      id: "tactile",
      title: "Tactile guidance is incomplete",
      severity: "minor" as const,
      reference: "RPwD Act · Schedule 2",
      recommendation: "Connect the accessible entrance to reception with continuous tactile guidance.",
    });
  }

  const score = Math.max(0, 100 - gaps.reduce((total, gap) => total + (gap.severity === "critical" ? 18 : gap.severity === "moderate" ? 10 : 4), 0));
  const report = {
    score,
    rating: Number((1 + score / 25).toFixed(1)),
    summary: gaps.length === 0
      ? "All submitted parameters meet the simulated checks for RPwD Act and National Building Code requirements."
      : `${gaps.length} gap${gaps.length === 1 ? "" : "s"} found. Resolve critical items before requesting a field verification.`,
    gaps,
    checkedAt: new Date().toISOString(),
  };

  res.json(RunComplianceCheckResponse.parse(report));
});

router.post("/audits", (req, res): void => {
  const parsed = SubmitAuditBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const currentBuildings = getBuildings();
  const building = currentBuildings.find((item) => item.id === parsed.data.buildingId);
  if (!building) {
    res.status(404).json({ error: "Building not found" });
    return;
  }
  const audit = {
    id: `audit-${Date.now()}`,
    auditorName: parsed.data.auditorName,
    submittedAt: new Date().toISOString(),
    status: "pending" as const,
    summary: parsed.data.summary,
  };
  building.audit = audit;
  building.auditor = parsed.data.auditorName;
  
  saveBuildings(currentBuildings);
  
  res.status(201).json(SubmitAuditResponse.parse(audit));
});

// --- Enhanced Auditor Workspace API Endpoints ---

router.get("/audits/queue", (_req, res): void => {
  const db = getDB();
  res.json({ queue: db.auditQueue || [] });
});

router.post("/audits/forward", (req, res): void => {
  const { buildingName, builderName, blueprintName, stage, aiScore, aiReport, provisions } = req.body;

  if (!buildingName || !builderName) {
    res.status(400).json({ error: "Building name and builder name are required." });
    return;
  }

  const db = getDB();
  const newAuditJob: AuditRecord = {
    id: `audit-job-${Date.now()}`,
    buildingName,
    builderName,
    blueprintName: blueprintName || "Building_Blueprint.pdf",
    stage: stage || "blueprint_approval",
    submittedAt: new Date().toISOString(),
    status: "pending",
    aiScore: aiScore || 85,
    aiReport: aiReport || { score: 85, summary: "Initial AI Analysis Completed", gaps: [] },
    provisions: provisions || {},
  };

  if (!db.auditQueue) db.auditQueue = [];
  db.auditQueue.unshift(newAuditJob);
  saveDB(db);

  res.status(201).json({ success: true, auditJob: newAuditJob });
});

router.patch("/audits/queue/:id/status", (req, res): void => {
  const { id } = req.params;
  const { status, delayReason, auditorNotes, auditorName, detailedReport } = req.body;

  const db = getDB();
  const job = (db.auditQueue || []).find((j) => j.id === id);

  if (!job) {
    res.status(404).json({ error: "Audit job not found." });
    return;
  }

  if (status) job.status = status;
  if (delayReason) job.delayReason = delayReason;
  if (auditorNotes) job.auditorNotes = auditorNotes;
  if (auditorName) job.auditorName = auditorName;
  if (detailedReport) job.detailedReport = detailedReport;
  job.reviewedAt = new Date().toISOString();

  // If approved or rejected, attach audit history to building record
  if (job.buildingName) {
    const building = db.buildings.find(
      (b) => b.name.toLowerCase() === job.buildingName.toLowerCase() || b.id === job.buildingId
    );
    if (building) {
      building.audit = {
        id: job.id,
        auditorName: auditorName || job.auditorName || "Inspector Auditor",
        submittedAt: new Date().toISOString(),
        status: status === "approved" ? "verified" : "pending",
        summary: auditorNotes || detailedReport?.detailedObservations || "Field inspection completed.",
      };
      if (status === "approved") {
        building.lastAudit = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      }
    }
  }

  saveDB(db);
  res.json({ success: true, auditJob: job });
});

export default router;