import { FollowRequestResponseDTO, AcceptFollowRequestResponseDTO, RejectFollowRequestResponseDTO, DeleteUnfollowResponseDTO, GetFollowRequestsResponseDTO } from '@/dtos/follow.dto';
import { acceptFollowRequest, deleteUnfollow, followRequest, getFollowRequests, rejectFollowRequest } from '@/services/follow.service';
import { AppError } from '@/utils/app-error';
import { ensureAuthExists } from '@/utils/validation.utils';
import { NextFunction, Request, Response } from 'express';

export const handleFollowRequest = async (
	req: Request,
	res: Response<FollowRequestResponseDTO>,
	next: NextFunction,
) => {
	const user = ensureAuthExists(req);

	const username = req.params.username;

	try {
		const response = await followRequest(username, user.id);

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
	const user = ensureAuthExists(req);

	// En realidad se puede pasar por el middleware de ObjectID
	const requestingUserID = req.params.requestingUserID;

	// TODO: retirar?
	// if (!requestingUserID) {
	// 	throw new AppError(404, 'Please, provide a user id');
	// };

	try {
		const response = await acceptFollowRequest(user.id, requestingUserID);

		res.status(200).json(response);
	} catch (error) {
		next(error)
	};
}

export const handleRejectFollowRequest = async (
	req: Request,
	res: Response<RejectFollowRequestResponseDTO>,
	next: NextFunction,
) => {
	const user = ensureAuthExists(req);

	// En realidad se puede pasar por el middleware de ObjectID
	const requestingUserID = req.params.requestingUserID;

	// TODO: retirar?
	// if (!requestingUserID) {
	// 	throw new AppError(404, 'Please, provide a user id');
	// };

	try {
		const response = await rejectFollowRequest(user.id, requestingUserID);

		res.status(200).json(response);
	} catch (error) {
		next(error)
	};
}

export const handleGetFollowRequests = async (
	req: Request,
	res: Response<GetFollowRequestsResponseDTO>,
	next: NextFunction,
) => {
	const user = ensureAuthExists(req);

	try {
		const response = await getFollowRequests(user.id);

		res.status(200).json(response);
	} catch (error) {
		next(error);
	};
};

export const handleUnfollowRequest = async (
	req: Request,
	res: Response<DeleteUnfollowResponseDTO>,
	next: NextFunction,
) => {
	const user = ensureAuthExists(req);

	const username = req.params.username;

	try {
		const response = await deleteUnfollow(user.id, username);

		res.status(200).json(response);
	} catch (error) {
		next(error);
	};
};