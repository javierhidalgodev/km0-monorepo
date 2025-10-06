import { FOLLOW_ERRORS } from '@/constants/messages';
import { FollowRequestResponseDTO, AcceptFollowRequestResponseDTO, RejectFollowRequestResponseDTO, DeleteUnfollowResponseDTO, GetFollowRequestsResponseDTO } from '@/dtos/follow.dto';
import { IUser, UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { followPublicUser, requestToFollowPrivateUser } from '@/utils/follow.service.utils';
import { ensureUserExists, findUserByID, findUserByUsername } from '@/utils/user.service.utils';

export const followRequest = async (username: string, requestingUserID: string): Promise<FollowRequestResponseDTO> => {
	const userToFollow = await findUserByUsername(username);

	if (userToFollow.id === requestingUserID) {
		throw new AppError(400, FOLLOW_ERRORS.CANNOT_FOLLOW_YOURSELF);
	};

	if (!userToFollow.isPublic) {
		return requestToFollowPrivateUser(userToFollow, requestingUserID);
	};

	return followPublicUser(userToFollow, requestingUserID);
};

export const acceptFollowRequest = async (userID: string, requestingUserID: string): Promise<AcceptFollowRequestResponseDTO> => {
	const user = await findUserByID(userID);
	const requestingUser = await findUserByID(requestingUserID);

	if (user.followers.includes(requestingUserID)) {
		throw new AppError(400, FOLLOW_ERRORS.ALREADY_FOLLOW);
	};

	if (!user.followRequests.includes(requestingUserID)) {
		throw new AppError(400, FOLLOW_ERRORS.NO_REQUESTED_TO_FOLLOW);
	};

	const updatedUser = ensureUserExists(
		await UserModel.findByIdAndUpdate<IUser>(userID, {
			$pull: { followRequests: requestingUserID },
			$addToSet: { followers: requestingUserID },
		}, { new: true })
	);

	await requestingUser.updateOne({
		$addToSet: { following: userID },
	});

	return {
		status: 'accepted',
		message: `Follow request from ${requestingUser.username} accepted`,
		user: {
			username: updatedUser.username,
			followers: updatedUser.followers.length,
			following: updatedUser.following.length,
			followRequests: updatedUser.followRequests,
		},
	};
};

export const rejectFollowRequest = async (userID: string, requestingUserID: string): Promise<RejectFollowRequestResponseDTO> => {
	const user = await findUserByID(userID);
	const requestingUser = await findUserByID(requestingUserID);

	if (user.followers.includes(requestingUserID)) {
		throw new AppError(400, FOLLOW_ERRORS.ALREADY_FOLLOW);
	};

	if (!user.followRequests.includes(requestingUserID)) {
		throw new AppError(400, FOLLOW_ERRORS.NO_REQUESTED_TO_FOLLOW);
	};

	await user.updateOne({
		$pull: { followRequests: requestingUserID },
	});

	return {
		status: 'rejected',
		message: `Follow request from ${requestingUser.username} rejected`,
	};
}

export type PopulateFollowRequestsUser = Omit<IUser, 'followRequests'> & ({
	followRequests: {
		id: string,
		username: string,
		bio?: string,
		isPublic: boolean,
	}[];
});

export const getFollowRequests = async (userID: string): Promise<GetFollowRequestsResponseDTO> => {
	const user = await findUserByID(userID);

	const populateUser = await user.populate<PopulateFollowRequestsUser>('followRequests', 'username bio isPublic');

	return {
		status: 'ok',
		followRequests: populateUser.followRequests,
	}
};

export const deleteUnfollow = async (userID: string, username: string): Promise<DeleteUnfollowResponseDTO> => {
	const userToUnfollow = await findUserByUsername(username);
	const requestingUser = await findUserByID(userID);

	if (!requestingUser.following.includes(userToUnfollow.id)) {
		throw new AppError(400, FOLLOW_ERRORS.NOT_FOLLOWING);
	};

	await requestingUser.updateOne({
		$pull: { following: userToUnfollow.id }
	});
	await userToUnfollow.updateOne({
		$pull: { followers: userID }
	});

	return {
		status: 'unfollowed',
		message: `You no longer follow ${userToUnfollow.username}`,
	};
};