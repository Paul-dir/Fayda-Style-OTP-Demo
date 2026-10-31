import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mockAuthRouter from "./mock-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mockAuthRouter);

export default router;
