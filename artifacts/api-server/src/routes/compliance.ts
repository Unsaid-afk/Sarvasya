import { Router, type IRouter } from "express";
import {
  RunComplianceCheckBody,
  RunComplianceCheckResponse,
  SubmitAuditBody,
  SubmitAuditResponse,
} from "@workspace/api-zod";
import { buildings } from "./buildings";

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
    checkedAt: "2026-08-08T09:42:00+05:30",
  };
  res.json(RunComplianceCheckResponse.parse(report));
});

router.post("/audits", (req, res): void => {
  const parsed = SubmitAuditBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const building = buildings.find((item) => item.id === parsed.data.buildingId);
  if (!building) {
    res.status(404).json({ error: "Building not found" });
    return;
  }
  const audit = {
    id: `audit-${Date.now()}`,
    auditorName: parsed.data.auditorName,
    submittedAt: "08 Aug 2026",
    status: "pending" as const,
    summary: parsed.data.summary,
  };
  building.audit = audit;
  building.auditor = parsed.data.auditorName;
  res.status(201).json(SubmitAuditResponse.parse(audit));
});

export default router;