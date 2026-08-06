import { Router, type IRouter, type Request, type Response } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import venuesRouter from "./venues";
import bookingsRouter from "./bookings";
import invitationsRouter from "./invitations";
import reviewsRouter from "./reviews";
import merchantsRouter from "./merchants";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(venuesRouter);
router.use(bookingsRouter);
router.use(invitationsRouter);
router.use(reviewsRouter);
router.use(merchantsRouter);
router.use(adminRouter);
router.use(storageRouter);

router.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

export default router;
