import { FollowRequestResponseDTO } from "@/dtos/post-follow.dto";
import { AcceptFollowRequestResponseDTO } from "@/dtos/patch-follow-request-accept.dto";
import { acceptFollowRequest, followRequest } from "@/services/follow.service";
import { AppError } from "@/utils/app-error";
import { NextFunction, Request, Response } from "express";

export const handleFollowRequest = async (
	req: Request,
	res: Response<FollowRequestResponseDTO>,
	next: NextFunction,
) => {
	if (!req.user) {
		throw new AppError(401, 'Invalid token');
	}

	const username = req.params.username;

	try {
		const response = await followRequest(username, req.user.id);

		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
}

export const handleAcceptFollowRequest = async (
	req: Request,
	res: Response<AcceptFollowRequestResponseDTO>,
	next: NextFunction,
) => {
	if (!req.user) {
		throw new AppError(401, 'Invalid token');
	}

	// En realidad se puede pasar por el middleware de ObjectID
	const requestingUserID = req.params.requestingUserID;

	// TODO: retirar?
	// if (!requestingUserID) {
	// 	throw new AppError(404, 'Please, provide a user id');
	// };

	try {
		const response = await acceptFollowRequest(req.user.id, requestingUserID);

		res.status(200).json(response);
	} catch (error) {
		next(error)
	};
}