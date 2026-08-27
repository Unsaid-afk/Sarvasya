import { Router, type IRouter } from "express";
import {
  ListNGOsResponse,
} from "@workspace/api-zod";
import { getDB } from "../lib/db";

const router: IRouter = Router();

router.get("/ngos", (_req, res): void => {
  const db = getDB();
  res.json(ListNGOsResponse.parse(db.ngos));
});

export default router;
