import { IUser, UserModel } from '@/models/user.model';
import { AppError } from './app-error';
import { USER_ERRORS } from '@/constants/messages';

export const ensureUserExists = (user: IUser | null): IUser => {
    if (!user) {
        throw new AppError(404, USER_ERRORS.NOT_FOUND);
    };

    return user;
};

export const findUserByID = async (userID: string): Promise<IUser> => {
	const user = await UserModel.findById(userID);

	if (!user) {
		throw new AppError(404, USER_ERRORS.NOT_FOUND);
	};

	return user;
}

export const findUserByUsername = async (username: string): Promise<IUser> => {
	const user = await UserModel.findOne({ username });

	if (!user) {
		throw new AppError(404, USER_ERRORS.NOT_FOUND);
	};

	return user;
}