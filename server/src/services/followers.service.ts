import { DeleteFollowerResponseDTO } from "@/dtos/delete-follower.dto";
import { UserModel } from "@/models/user.model"
import { AppError } from "@/utils/app-error";
import { findUserByUsername } from "@/utils/user.service.utils";

export const deleteFollower = async (userID: string, username: string): Promise<DeleteFollowerResponseDTO> => {
    const user = await UserModel.findById(userID);
    const userToDelete = await findUserByUsername(username);

    if (!user) {
        throw new AppError(404, 'User not found');
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