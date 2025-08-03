import { FollowRequestResponseDTO } from '@/dtos/follow.dto';
import { IUser } from '@/models/user.model';
import { AppError } from './app-error';

export const requestToFollowPrivateUser = async (userToFollow: IUser, requestingUserID: string): Promise<FollowRequestResponseDTO> => {
	if (userToFollow.followRequests.includes(requestingUserID)) {
		throw new AppError(400, 'Already requested. Wait for user response');
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
	if (userToFollow.followers.includes(requestingUserID)) {
		throw new AppError(400, 'Already following');
	};

	await userToFollow.updateOne({
		$addToSet: { followers: requestingUserID },
	});

	return {
		status: 'followed',
		message: `Following ${userToFollow.username}`,
	};
};