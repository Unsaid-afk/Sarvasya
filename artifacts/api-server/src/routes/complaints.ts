import { Router, type IRouter } from "express";
import {
  SubmitComplaintBody,
  SubmitComplaintResponse,
  ListComplaintsResponse,
  UpdateComplaintStatusBody,
  UpdateComplaintStatusResponse,
} from "@workspace/api-zod";
import { getDB, saveDB } from "../lib/db";

const router: IRouter = Router();

router.get("/complaints", (_req, res): void => {
  const db = getDB();
  res.json(ListComplaintsResponse.parse(db.complaints));
});

router.post("/complaints", (req, res): void => {
  const parsed = SubmitComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const db = getDB();
  const input = parsed.data;
  
  // Find building name
  const building = db.buildings.find(b => b.id === input.buildingId);
  if (!building) {
    res.status(404).json({ error: "Building not found" });
    return;
  }
  
  const newComplaint = {
    id: `COMP-${Date.now().toString().slice(-4)}`,
    buildingId: input.buildingId,
    buildingName: building.name,
    category: input.category,
    details: input.details,
    status: "Submitted" as const,
    officer: "Officer Devendra Varma, HUD",
    dismissReason: "",
    filedBy: input.filedBy,
    submittedAt: new Date().toISOString(),
  };

  db.complaints.unshift(newComplaint);
  saveDB(db);

  res.status(201).json(SubmitComplaintResponse.parse(newComplaint));
});

router.patch("/complaints/:id", (req, res): void => {
  const parsed = UpdateComplaintStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const db = getDB();
  const complaint = db.complaints.find(c => c.id === req.params.id);
  
  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  complaint.status = parsed.data.status;
  if (parsed.data.dismissReason) {
    complaint.dismissReason = parsed.data.dismissReason;
  }

  saveDB(db);
  res.json(UpdateComplaintStatusResponse.parse(complaint));
});

export default router;
