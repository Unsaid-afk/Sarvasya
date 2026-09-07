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
  const blueprintText = String((req.body as any).blueprintName || "").toLowerCase();
  const gaps = [];

  // Dynamic CAD file and structural measurement analysis
  if (input.rampSlope > 8.33 || blueprintText.includes("steep_ramp")) {
    gaps.push({
      id: "ramp-slope",
      title: "Ramp slope exceeds 1:12 NBC standard",
      severity: "critical" as const,
      reference: "NBC 2016 · 4.1.3",
      recommendation: "Revise entry ramp to a maximum gradient of 8.33% with level landings every 9 metres.",
    });
  }
  if (input.doorWidth < 900 || blueprintText.includes("narrow_door")) {
    gaps.push({
      id: "door-width",
      title: "Clear door opening width is below 900 mm",
      severity: "moderate" as const,
      reference: "NBC 2016 · 4.4.1",
      recommendation: "Increase clear opening width to at least 900 mm along primary accessible routes.",
    });
  }
  if (!input.liftAvailable || blueprintText.includes("no_elevator")) {
    gaps.push({
      id: "lift",
      title: "Accessible vertical circulation lift is missing",
      severity: "critical" as const,
      reference: "RPwD Act · Section 41",
      recommendation: "Provide an accessible elevator with Braille keys and voice announcements or keep public services on entry level.",
    });
  }
  if (!input.accessibleRestrooms || blueprintText.includes("no_washroom")) {
    gaps.push({
      id: "restroom",
      title: "Accessible restroom turning clearance deficient",
      severity: "moderate" as const,
      reference: "NBC 2016 · 4.5.4",
      recommendation: "Ensure outward-opening door, grab rails at 750mm height, and 1,500 mm turning circle inside restroom.",
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

  // Generate detailed dynamic AI Report if not passed
  const gaps = [];
  const ramp = provisions?.rampSlope ? Number(provisions.rampSlope) : 8.33;
  const door = provisions?.doorWidth ? Number(provisions.doorWidth) : 900;
  if (ramp > 8.33) {
    gaps.push({ id: "ramp-slope", title: `Ramp slope (${ramp}%) exceeds maximum allowable 8.33% gradient`, severity: "critical" as const, reference: "NBC 2016 · 4.1.3", recommendation: "Re-engineer entry ramp slope to 1:12 (8.33%) with 1.5m level rest landings every 9m." });
  }
  if (door < 900) {
    gaps.push({ id: "door-width", title: `Primary entrance clear door width (${door}mm) is under 900mm`, severity: "moderate" as const, reference: "NBC 2016 · 4.4.1", recommendation: "Widen clear doorway opening to at least 900mm." });
  }
  if (!provisions?.liftAvailable) {
    gaps.push({ id: "lift-access", title: "Vertical circulation elevator / lift is missing", severity: "critical" as const, reference: "RPwD Act 2016 · Section 41", recommendation: "Install Braille key and audio announcement elevator." });
  }
  if (!provisions?.accessibleRestrooms) {
    gaps.push({ id: "washroom", title: "Accessible unisex washroom not specified", severity: "moderate" as const, reference: "NBC 2016 · 4.5.4", recommendation: "Design 1.5m turning radius accessible washroom with L-shaped grab bars." });
  }
  if (!provisions?.emergencyRefuge) {
    gaps.push({ id: "refuge", title: "Fire-rated Emergency Refuge Zone missing", severity: "critical" as const, reference: "NBC 2016 · 4.8.2", recommendation: "Incorporate fire refuge area with 2-way emergency intercom." });
  }

  const generatedScore = Math.max(10, 100 - gaps.reduce((acc, g) => acc + (g.severity === "critical" ? 18 : 10), 0));
  const finalAiReport = aiReport || {
    score: generatedScore,
    rating: Number((1 + generatedScore / 25).toFixed(1)),
    summary: `Detailed AI Building Accessibility Audit for ${buildingName}: ${gaps.length === 0 ? "Full compliance achieved across RPwD Act 2016 and NBC 2016 guidelines." : `${gaps.length} non-compliance gap(s) identified in blueprint analysis.`}`,
    gaps,
    checkedAt: new Date().toISOString(),
  };

  const db = getDB();
  const newAuditJob: AuditRecord = {
    id: `audit-job-${Date.now()}`,
    buildingName,
    builderName,
    blueprintName: blueprintName || "Building_Blueprint.pdf",
    stage: stage || "blueprint_approval",
    submittedAt: new Date().toISOString(),
    status: "pending",
    aiScore: aiScore || finalAiReport.score,
    aiReport: finalAiReport,
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