import { FollowRequestResponseDTO } from "@/dtos/follow.dto";
import { UserModel } from "@/models/user.model"
import { AppError } from "@/utils/app-error";

export const followRequest = async (username: string, requestingUserID: string): Promise<FollowRequestResponseDTO> => {
	const userToFollow = await UserModel.findOne({ username });

	if (!userToFollow) {
		throw new AppError(404, 'User not found');
	};

	if (!userToFollow.isPublic) {
		if (userToFollow.followRequests.includes(requestingUserID)) {
			throw new AppError(400, 'Already requested');
		};

		await userToFollow.updateOne({
			$addToSet: { followRequests: requestingUserID },
		});

		return {
			status: 'pending',
			message: 'Wait for user response',
		};
	};

	if (userToFollow.followers.includes(requestingUserID)) {
		throw new AppError(400, 'Already following');
	};

	await userToFollow.updateOne({
		$addToSet: { followers: requestingUserID },
	});

	return {
		status: 'followed',
		message: `Following ${username}`,
	};
}	