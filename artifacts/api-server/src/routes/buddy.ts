import { Router, type IRouter } from "express";
import { getDB, saveDB, type BuddyRequestRecord } from "../lib/db";

const router: IRouter = Router();

router.get("/buddy-requests", (_req, res): void => {
  const db = getDB();
  res.json({ requests: db.buddyRequests || [] });
});

router.post("/buddy-requests", (req, res): void => {
  const { userName, contactNumber, location, assistanceType } = req.body;

  if (!userName || !location) {
    res.status(400).json({ error: "User name and location are required." });
    return;
  }

  const db = getDB();
  const newRequest: BuddyRequestRecord = {
    id: `buddy-${Date.now()}`,
    userName,
    contactNumber: contactNumber || "Not provided",
    location,
    assistanceType: assistanceType || "General Companion Assistance",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (!db.buddyRequests) {
    db.buddyRequests = [];
  }

  db.buddyRequests.unshift(newRequest);
  saveDB(db);

  res.status(201).json({ success: true, request: newRequest });
});

router.patch("/buddy-requests/:id/accept", (req, res): void => {
  const { id } = req.params;
  const { companionName } = req.body;

  const db = getDB();
  const request = (db.buddyRequests || []).find((r) => r.id === id);

  if (!request) {
    res.status(404).json({ error: "Buddy request not found." });
    return;
  }

  request.status = "accepted";
  request.acceptedBy = companionName || "Volunteer Buddy";
  saveDB(db);

  res.json({ success: true, request });
});

export default router;
