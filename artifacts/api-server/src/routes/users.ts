import { Router, type IRouter } from "express";
import { getDB } from "../lib/db";
import { GetUserStrikesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:name/strikes", (req, res): void => {
  const db = getDB();
  const userName = req.params.name;
  
  // A strike is defined as a complaint that was dismissed and the reason implies it was fake.
  const strikes = db.complaints.filter(c => {
    return c.filedBy === userName && 
           c.status === "Dismissed" && 
           c.dismissReason?.toLowerCase().includes("fake");
  }).length;
  
  res.json(GetUserStrikesResponse.parse({ strikes }));
});

export default router;
