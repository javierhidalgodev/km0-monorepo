import { IUser, UserModel } from '@/models/user.model';
import { AppError } from './app-error';

// TODO: parametrizar para hacer la función extensible al resto de endpoints?
export const findUserByUsername = async (username: string): Promise<IUser> => {
	const user = await UserModel.findOne({ username });

	if (!user) {
		throw new AppError(404, 'User not found');
	};

	return user;
}