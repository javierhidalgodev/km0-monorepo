import { handleFollowRequest } from "@/controllers/follow.controller";
import { authenticateToken } from "@/middlewares/authenticate-token";
import { Router } from "express";

const followRoutes = Router();

followRoutes.post(
	'/follow/:username',
	authenticateToken(),
	handleFollowRequest,
);

export default followRoutes;