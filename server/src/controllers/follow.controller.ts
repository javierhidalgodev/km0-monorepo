import { followRequest } from "@/services/follow.service";
import { AppError } from "@/utils/app-error";
import { NextFunction, Request, Response } from "express";

export const handleFollowRequest = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if(!req.user) {
		throw new AppError(401, 'Invalid token');
	}

	const username = req.params.username;

	try {
		const response = await followRequest(username, req.user.id);

		console.log(response);
	
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
}