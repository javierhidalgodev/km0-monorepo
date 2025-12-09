import { FollowRequestResponseDTO } from '@/dtos/follow.dto';
import { IUser } from '@/models/user.model';
import { AppError } from './app-error';
import { FOLLOW_ERRORS } from '@/constants/messages';
import { findUserByID } from './user.utils';

export const requestToFollowPrivateUser = async (userToFollow: IUser, requestingUserID: string): Promise<FollowRequestResponseDTO> => {
	// Si tiene petición pendiente
	if (userToFollow.followRequests.includes(requestingUserID)) {
		throw new AppError(400, FOLLOW_ERRORS.FOLLOW_REQUEST_PENDING);
	};

	// Si ya es seguidor
	if (userToFollow.followers.includes(requestingUserID)) {
		throw new AppError(400, FOLLOW_ERRORS.ALREADY_FOLLOWING);
	};

	await userToFollow.updateOne({
		$addToSet: { followRequests: requestingUserID },
	});

	return {
		status: 'pending',
		message: 'Wait for user response',
	};
};

export const followPublicUser = async (userToFollow: IUser, requestingUserID: string): Promise<FollowRequestResponseDTO> => {
	const requestingUser = await findUserByID(requestingUserID);

	if (userToFollow.followers.includes(requestingUserID)) {
		throw new AppError(400, FOLLOW_ERRORS.ALREADY_FOLLOWING);
	};

	await userToFollow.updateOne({
		$addToSet: { followers: requestingUserID },
	});

	await requestingUser.updateOne({
		$addToSet: { following: userToFollow.id },
	});

	return {
		status: 'followed',
		message: `Following ${userToFollow.username}`,
	};
};