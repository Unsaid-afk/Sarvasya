import { Router, type IRouter } from "express";
import {
  CreateVolunteerBookingBody,
  CreateVolunteerBookingResponse,
  ListVolunteerBookingsResponse,
} from "@workspace/api-zod";
import { getDB, saveDB } from "../lib/db";

const router: IRouter = Router();

router.get("/volunteer-bookings", (_req, res): void => {
  const db = getDB();
  res.json(ListVolunteerBookingsResponse.parse(db.volunteerBookings));
});

router.post("/volunteer-bookings", (req, res): void => {
  const parsed = CreateVolunteerBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const db = getDB();
  const input = parsed.data;
  
  const newBooking = {
    id: `VOL-${Date.now()}`,
    ngoName: input.ngoName,
    ngoType: input.ngoType,
    date: input.date,
    task: input.task,
    occasion: input.occasion || "",
  };

  db.volunteerBookings.unshift(newBooking);
  saveDB(db);

  res.status(201).json(CreateVolunteerBookingResponse.parse(newBooking));
});

export default router;
