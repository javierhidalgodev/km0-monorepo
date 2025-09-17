import { DeleteFollowerResponseDTO } from '@/dtos/followers.dto';
import { AppError } from '@/utils/app-error';
import { findUserByID, findUserByUsername } from '@/utils/user.service.utils';

export const deleteFollower = async (userID: string, username: string): Promise<DeleteFollowerResponseDTO> => {
    const user = await findUserByID(userID);
    const userToDelete = await findUserByUsername(username);

    if (user.id === userToDelete.id) {
        throw new AppError(400, 'Cannot delete yourself, because you can\'t follow yourself');
    };

    if (!user.followers.includes(userToDelete.id)) {
        throw new AppError(400, 'This user is not following you');
    };

    await user.updateOne({
        $pull: { followers: userToDelete.id },
    });

    return {
        status: 'deleted',
        message: `User ${username} no longer following you`,
    };
};