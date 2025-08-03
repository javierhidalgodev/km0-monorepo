import { FollowRequestResponseDTO } from '@/dtos/follow.dto';
import { AppError } from '@/utils/app-error';
import { followPublicUser, requestToFollowPrivateUser } from '@/utils/follow.service.utils';
import { findUserByUsername } from '@/utils/user.service.utils';

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