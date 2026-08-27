import { Router, type IRouter } from "express";
import healthRouter from "./health";
import buildingsRouter from "./buildings";
import complianceRouter from "./compliance";
import complaintsRouter from "./complaints";
import ngosRouter from "./ngos";
import volunteerBookingsRouter from "./volunteer-bookings";
import safeSpotsRouter from "./safe-spots";
import buddyRouter from "./buddy";
import helplinesRouter from "./helplines";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(buildingsRouter);
router.use(complianceRouter);
router.use(complaintsRouter);
router.use(ngosRouter);
router.use(volunteerBookingsRouter);
router.use(safeSpotsRouter);
router.use(buddyRouter);
router.use(helplinesRouter);
router.use(usersRouter);

export default router;
