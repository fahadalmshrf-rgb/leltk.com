import { Router } from "express";
import invitationsRouter from "./invitations";
import authRouter from "./auth";
import venuesRouter from "./venues";
import bookingsRouter from "./bookings";
import categoriesRouter from "./categories";
import reviewsRouter from "./reviews";
import merchantsRouter from "./merchants";
import adminRouter from "./admin";
import storageRouter from "./storage";
import healthRouter from "./health";

const router = Router();
router.use("/invitations", invitationsRouter);
router.use("/auth", authRouter);
router.use("/venues", venuesRouter);
router.use("/bookings", bookingsRouter);
router.use("/categories", categoriesRouter);
router.use("/reviews", reviewsRouter);
router.use("/merchants", merchantsRouter);
router.use("/admin", adminRouter);
router.use("/storage", storageRouter);
router.use("/health", healthRouter);

export default router;
 