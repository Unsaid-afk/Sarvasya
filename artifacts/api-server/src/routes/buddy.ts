import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/buddy-requests", (_req, res): void => {
  // Mock broadcasting the request
  setTimeout(() => {
    res.status(200).json({ success: true });
  }, 1000);
});

export default router;
