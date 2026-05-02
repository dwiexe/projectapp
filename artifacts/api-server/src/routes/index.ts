import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ppobRouter from "./ppob";
import adminRouter from "./admin";
import qrisRouter from "./qris";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ppobRouter);
router.use("/admin", adminRouter);
router.use("/qris", qrisRouter);
router.use("/users", usersRouter);

export default router;
