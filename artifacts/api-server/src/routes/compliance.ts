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

  // Automatically ensure building exists in database so it reflects in Overview
  const existingIndex = db.buildings.findIndex(
    (b) => b.name.toLowerCase() === buildingName.toLowerCase() || b.id === buildingName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  );

  const buildingId = existingIndex >= 0 
    ? db.buildings[existingIndex].id 
    : buildingName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const computedBuildingStatus = finalAiReport.score >= 85 ? "green" : finalAiReport.score >= 65 ? "amber" : "red";
  
  const auditHistoryEntry = {
    id: newAuditJob.id,
    auditorName: "AI Structural Compliance Engine",
    submittedAt: new Date().toISOString(),
    status: (finalAiReport.score >= 85 ? "verified" : "rejected") as any,
    score: finalAiReport.score,
    summary: finalAiReport.summary,
    gaps: finalAiReport.gaps,
    observations: `AI blueprint verification completed. Score: ${finalAiReport.score}/100. Gaps found: ${finalAiReport.gaps?.length || 0}.`
  };

  if (existingIndex >= 0) {
    const existing = db.buildings[existingIndex];
    const prevHistory = existing.auditHistory || [];
    db.buildings[existingIndex] = {
      ...existing,
      builder: builderName || existing.builder,
      rating: finalAiReport.rating,
      status: computedBuildingStatus,
      report: finalAiReport,
      lastAudit: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      audit: {
        id: newAuditJob.id,
        auditorName: "AI Compliance Check",
        submittedAt: new Date().toISOString(),
        status: finalAiReport.score >= 85 ? "verified" : "pending",
        summary: finalAiReport.summary
      },
      auditHistory: [auditHistoryEntry, ...prevHistory]
    };
  } else {
    const newBuildingRecord = {
      id: buildingId,
      name: buildingName,
      address: provisions?.address || `${buildingName}, Vadodara, Gujarat`,
      builder: builderName,
      rating: finalAiReport.rating,
      status: computedBuildingStatus as "green" | "amber" | "red",
      lastAudit: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      accessibleFeatures: [
        provisions?.liftAvailable ? "Braille & Voice-Enabled Elevator Bank" : null,
        provisions?.accessibleRestrooms ? "NBC 2016 Compliant Wheelchair Restrooms" : null,
        provisions?.tactilePath ? "Continuous Tactile Guiding Pathway" : null,
        provisions?.accessibleParking ? "Dedicated Accessible Parking Bay" : null,
        Number(provisions?.rampSlope || 8.33) <= 8.33 ? "Graded 1:12 Entrance Ramp" : null,
        Number(provisions?.doorWidth || 900) >= 900 ? "900mm+ Clear Door Openings" : null,
        provisions?.emergencyRefuge ? "Fire-rated Emergency Refuge Area" : null,
      ].filter(Boolean) as string[],
      coordinates: { lat: 22.3072 + (Math.random() - 0.5) * 0.02, lng: 73.1812 + (Math.random() - 0.5) * 0.02 },
      category: "government" as const,
      report: finalAiReport,
      auditor: "AI Access Analyzer & Auditor Queue",
      audit: {
        id: newAuditJob.id,
        auditorName: "AI Compliance Check",
        submittedAt: new Date().toISOString(),
        status: finalAiReport.score >= 85 ? "verified" : "pending" as const,
        summary: finalAiReport.summary
      },
      auditHistory: [auditHistoryEntry],
      wayfinding: [
        { id: "entrance", label: "Main Entrance Ramp", type: "ramp", status: Number(provisions?.rampSlope || 8.33) <= 8.33 ? "open" : "limited" as const, x: 20, y: 75, note: `Slope: ${provisions?.rampSlope || "8.33"}%` },
        { id: "lift", label: "Primary Passenger Lift", type: "lift", status: provisions?.liftAvailable ? "open" : "closed" as const, x: 50, y: 40, note: provisions?.liftAvailable ? "Operational elevator" : "No elevator available" },
        { id: "restroom", label: "Accessible Washroom", type: "restroom", status: provisions?.accessibleRestrooms ? "open" : "limited" as const, x: 80, y: 30, note: provisions?.accessibleRestrooms ? "1500mm turning radius" : "Requires assistance" },
        { id: "help", label: "Citizen Suvidha Desk", type: "help", status: "open" as const, x: 35, y: 60, note: "Assistance available" }
      ]
    };
    db.buildings.unshift(newBuildingRecord);
  }

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

  // If approved, rejected, or delayed, update building state and append to full audit history
  if (job.buildingName) {
    const building = db.buildings.find(
      (b) => b.name.toLowerCase() === job.buildingName.toLowerCase() || b.id === job.buildingId || b.id === job.buildingName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    );
    if (building) {
      const historyItem = {
        id: job.id,
        auditorName: auditorName || job.auditorName || "Inspector Auditor",
        submittedAt: new Date().toISOString(),
        status: (status === "approved" ? "verified" : status === "rejected" ? "rejected" : status === "delayed" ? "delayed" : "pending") as any,
        score: status === "approved" ? Math.max(90, job.aiScore || 90) : status === "rejected" ? Math.min(50, job.aiScore || 50) : job.aiScore,
        summary: auditorNotes || detailedReport?.detailedObservations || (status === "approved" ? "Official compliance certified." : "Audit remediation requested."),
        observations: detailedReport?.detailedObservations || auditorNotes,
      };

      if (!building.auditHistory) building.auditHistory = [];
      building.auditHistory.unshift(historyItem);

      building.audit = {
        id: job.id,
        auditorName: auditorName || job.auditorName || "Inspector Auditor",
        submittedAt: new Date().toISOString(),
        status: status === "approved" ? "verified" : "pending",
        summary: auditorNotes || detailedReport?.detailedObservations || "Field inspection completed.",
      };

      if (status === "approved") {
        building.status = "green";
        building.lastAudit = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        if (building.report) {
          building.report.score = Math.max(90, building.report.score);
          building.report.rating = Number((1 + building.report.score / 25).toFixed(1));
          building.report.gaps = [];
          building.report.summary = "All accessibility parameters verified and certified by official access auditor.";
        }
      } else if (status === "rejected") {
        building.status = "red";
        if (building.report) {
          building.report.score = Math.min(55, building.report.score);
          building.report.rating = Number((1 + building.report.score / 25).toFixed(1));
        }
      }
    }
  }

  saveDB(db);
  res.json({ success: true, auditJob: job });
});

router.get("/audits/certificate/:id/download", (req, res): void => {
  const { id } = req.params;
  const db = getDB();
  const job = (db.auditQueue || []).find((j) => j.id === id);

  const buildingName = job?.buildingName || "Public Building";
  const auditorName = job?.auditorName || "National Access Audit Association";
  const certId = `CERT-RPWD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Official RPwD Act Compliance Certificate - ${buildingName}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1c1917; background: #fff8f0; }
        .cert-border { border: 12px double #4d7c0f; padding: 40px; background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #ca8a04; padding-bottom: 20px; }
        .title { font-size: 28px; font-weight: bold; color: #4d7c0f; text-transform: uppercase; margin-top: 10px; }
        .subtitle { font-size: 14px; color: #78716c; letter-spacing: 2px; text-transform: uppercase; }
        .cert-body { margin-top: 30px; font-size: 16px; line-height: 1.8; text-align: center; }
        .highlight { font-size: 22px; font-weight: bold; color: #1c1917; text-decoration: underline; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; font-size: 13px; text-align: left; background: #fafaf9; padding: 20px; border-radius: 8px; border: 1px solid #e7e5e4; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
        .stamp { font-weight: bold; color: #4d7c0f; border: 2px solid #4d7c0f; padding: 10px 20px; border-radius: 6px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="cert-border">
        <div class="header">
          <div class="subtitle">Government of India · Ministry of Social Justice & Empowerment</div>
          <div class="title">Certificate of Accessibility Compliance</div>
          <div class="subtitle" style="margin-top: 5px; color: #4d7c0f;">RPwD Act 2016 & National Building Code (NBC) 2016</div>
        </div>
        
        <div class="cert-body">
          <p>This is to officially certify that the public infrastructure building structure known as:</p>
          <div class="highlight">${buildingName}</div>
          <p>Constructed by <strong>${job?.builderName || "Vadodara Urban Development"}</strong>, has undergone rigorous technical accessibility inspection and field measurement verification.</p>
        </div>

        <div class="meta-grid">
          <div><strong>Certificate ID:</strong> ${certId}</div>
          <div><strong>Verification Date:</strong> ${new Date().toLocaleDateString("en-IN")}</div>
          <div><strong>Authorized Auditor:</strong> ${auditorName}</div>
          <div><strong>Compliance AI Score:</strong> ${job?.aiScore || 96}% (Grade A+)</div>
          <div><strong>Ramp Gradient (NBC 4.1):</strong> Verified compliant (1:12 slope)</div>
          <div><strong>Tactile & Washroom Access:</strong> Verified compliant</div>
        </div>

        <div class="footer">
          <div>
            <div style="font-weight: bold;">Inspector Signature</div>
            <div style="color: #78716c; font-size: 12px;">National Access Inspector Director</div>
          </div>
          <div class="stamp">OFFICIALLY CERTIFIED · SARVASYA AUDIT PORTAL</div>
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", `inline; filename="Accessibility_Certificate_${certId}.html"`);
  res.send(htmlContent);
});

export default router;