import { FollowRequestResponseDTO } from '@/dtos/post-follow.dto';
import { AcceptFollowRequestResponseDTO } from '@/dtos/patch-follow-request-accept.dto';
import { UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { followPublicUser, requestToFollowPrivateUser } from '@/utils/follow.service.utils';
import { findUserByUsername } from '@/utils/user.service.utils';
import { RejectFollowRequestResponseDTO } from '@/dtos/patch-follow-request-reject.dto';

export const followRequest = async (username: string, requestingUserID: string): Promise<FollowRequestResponseDTO> => {
	const userToFollow = await findUserByUsername(username);

	if (userToFollow.id === requestingUserID) {
		throw new AppError(400, 'Cannot follow yourself');
	};

	if (!userToFollow.isPublic) {
		return requestToFollowPrivateUser(userToFollow, requestingUserID);
	};

	return followPublicUser(userToFollow, requestingUserID);
};

export const acceptFollowRequest = async (userID: string, requestingUserID: string): Promise<AcceptFollowRequestResponseDTO> => {
	const user = await UserModel.findById(userID);
	const requestingUser = await UserModel.findById(requestingUserID);

	if (!user || !requestingUser) {
		throw new AppError(404, 'User not found');
	};

	if (user.followers.includes(requestingUserID)) {
		throw new AppError(400, 'This user already follows you');
	};

	if (!user.followRequests.includes(requestingUserID)) {
		throw new AppError(400, 'This user does not requested to follow you');
	};

	const updatedUser = await UserModel.findByIdAndUpdate(userID, {
		$pull: { followRequests: requestingUserID },
		$addToSet: { followers: requestingUserID },
	}, { new: true });

	if (!updatedUser) {
		throw new AppError(404, 'User not found');
	};

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
	const user = await UserModel.findById(userID);
	const requestingUser = await UserModel.findById(requestingUserID);

	if (!user || !requestingUser) {
		throw new AppError(404, 'User not found');
	};

	if (user.followers.includes(requestingUserID)) {
		throw new AppError(400, 'This user already follows you');
	};

	if (!user.followRequests.includes(requestingUserID)) {
		throw new AppError(400, 'This user does not requested to follow you');
	};

	await user.updateOne({
		$pull: { followRequests: requestingUserID },
	});

	return {
		status: 'rejected',
		message: `Follow request from ${requestingUser.username} rejected`,
	};
}