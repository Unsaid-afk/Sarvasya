import { Router, type IRouter } from "express";
import {
  CreateSafeSpotBody,
  CreateSafeSpotResponse,
  ListSafeSpotsResponse,
} from "@workspace/api-zod";
import { getDB, saveDB } from "../lib/db";

const router: IRouter = Router();

router.get("/safe-spots", (_req, res): void => {
  const db = getDB();
  res.json(ListSafeSpotsResponse.parse(db.safeSpots));
});

router.post("/safe-spots", (req, res): void => {
  const parsed = CreateSafeSpotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const db = getDB();
  const input = parsed.data;
  
  const newSafeSpot = {
    id: `SPOT-${Date.now()}`,
    name: input.name,
    buildingId: input.buildingId,
    note: input.note,
  };

  db.safeSpots.push(newSafeSpot);
  saveDB(db);

  res.status(201).json(CreateSafeSpotResponse.parse(newSafeSpot));
});

export default router;
