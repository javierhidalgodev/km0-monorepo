import { FollowRequestResponseDTO } from '@/dtos/follow.dto';
import { IUser, UserModel } from '@/models/user.model';
import { AppError } from './app-error';

export const requestToFollowPrivateUser = async (userToFollow: IUser, requestingUserID: string): Promise<FollowRequestResponseDTO> => {
	// Si tiene petición pendiente
	if (userToFollow.followRequests.includes(requestingUserID)) {
		throw new AppError(400, 'Follow request already pending');
	};

	// Si ya es seguidor
	if (userToFollow.followers.includes(requestingUserID)) {
		throw new AppError(400, 'Already following');
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
	const requestingUser = await UserModel.findById(requestingUserID)

	// Raro, porque el token no pasaría desde el middleware
	if (!requestingUser) {
		throw new AppError(404, 'Requesting user not found');
	};

	if (userToFollow.followers.includes(requestingUserID)) {
		throw new AppError(400, 'Already following');
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