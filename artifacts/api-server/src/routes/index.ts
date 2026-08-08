import { Router, type IRouter } from "express";
import healthRouter from "./health";
import buildingsRouter from "./buildings";
import complianceRouter from "./compliance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(buildingsRouter);
router.use(complianceRouter);

export default router;
