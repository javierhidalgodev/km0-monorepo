import { handleAcceptFollowRequest, handleFollowRequest, handleRejectFollowRequest } from "@/controllers/follow.controller";
import { authenticateToken } from "@/middlewares/authenticate-token";
import { validateObjectID } from "@/middlewares/validate";
import { Router } from "express";

const followRoutes = Router();

followRoutes.post(
	'/follow/:username',
	authenticateToken(),
	handleFollowRequest,
);

followRoutes.patch(
	'/follow-requests/:requestingUserID/accept',
	authenticateToken(),
	validateObjectID('requestingUserID'),
	handleAcceptFollowRequest,
)

followRoutes.patch(
	'/follow-requests/:requestingUserID/reject',
	authenticateToken(),
	validateObjectID('requestingUserID'),
	handleRejectFollowRequest,
)

export default followRoutes;