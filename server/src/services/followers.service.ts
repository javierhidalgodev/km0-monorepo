import { FOLLOWER_ERRORS } from '@/constants/messages';
import { DeleteFollowerResponseDTO } from '@/dtos/followers.dto';
import { AppError } from '@/utils/app-error';
import { findUserByID, findUserByUsername } from '@/utils/user.utils';

export const deleteFollower = async (userID: string, username: string): Promise<DeleteFollowerResponseDTO> => {
    const user = await findUserByID(userID);
    const userToDelete = await findUserByUsername(username);

    if (user.id === userToDelete.id) {
        throw new AppError(400, FOLLOWER_ERRORS.CANNOT_DELETE_YOURSELF);
    };

    if (!user.followers.includes(userToDelete.id)) {
        throw new AppError(400, FOLLOWER_ERRORS.NOT_FOLLOWING_YOU);
    };

    await user.updateOne({
        $pull: { followers: userToDelete.id },
    });

    return {
        status: 'deleted',
        message: `User ${username} no longer following you`,
    };
};