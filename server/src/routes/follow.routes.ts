import { handleAcceptFollowRequest, handleFollowRequest } from "@/controllers/follow.controller";
import { authenticateToken } from "@/middlewares/authenticate-token";
import { validate, validateObjectID } from "@/middlewares/validate";
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

// followRoutes.patch(
// 	'/follow/:requestingUserID/reject',
// )

export default followRoutes;