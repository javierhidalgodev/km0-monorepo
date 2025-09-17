/**
 * Lógica interna para la creación de un usuario
 * que no dependa del framework (Express.js)
 */

import { CreateUserRequestDTO, CreateUserResponseDTO, LoginRequestDTO, LoginResponseDTO, PatchProfileRequestDTO, PatchProfileResponseDTO, GetProfileResponseDTO, GetUsersFollowersResponseDTO, GetUsersFollowingResponseDTO } from '@/dtos/users.dto';
import { IUser, TPopulateFollowers, TPopulateFollowing, UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { comparePassword, generateToken, hashPassword } from '@/utils/auth';
import { ensureUserExists, findUserByUsername } from '@/utils/user.service.utils';

export const createUser = async (data: CreateUserRequestDTO): Promise<CreateUserResponseDTO> => {
    const { email, password } = data;

    const exists = await UserModel.findOne({ email });

    if (exists) {
        throw new AppError(409, 'This email is already in use');
    };

    const hashedPassword = await hashPassword(password);

    const user = await UserModel.create({
        ...data,
        password: hashedPassword,
    });

    return {
        status: 'created',
        user: {
            username: user.username,
            email: user.email,
            birthdate: user.birthdate,
        },
    };
};

export const loginUser = async (data: LoginRequestDTO): Promise<LoginResponseDTO> => {
    const user = await UserModel.findOne({ email: data.email });

    if (!user) {
        throw new AppError(401, 'Invalid credentials');
    };

    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
        throw new AppError(401, 'Invalid credentials');
    };

    const token = generateToken(user);

    return {
        status: 'logged',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
    };
};

export const getUsersFollowers = async (userID: string, username: string): Promise<GetUsersFollowersResponseDTO> => {
    const user = await findUserByUsername(username);

    const populateFollowerUser = await user
        .populate<TPopulateFollowers>('followers', 'username bio followers following');

    // Usuario privado y que no coincide con el ID del solicitante, contenido bloqueado
    if (!user.isPublic && userID !== user.id) {
        throw new AppError(403, 'Forbidden');
    }

    const formatted = populateFollowerUser.followers.map(f => ({
        id: f.id,
        username: f.username,
        bio: f.bio,
        followers: f.followers.length,
        following: f.following.length,
    }));

    return {
        status: 'ok',
        followers: formatted,
    }
};

export const getUsersFollowing = async (userID: string, username: string): Promise<GetUsersFollowingResponseDTO> => {
    const user = await findUserByUsername(username);

    const populateFollowingUser = await user
        .populate<TPopulateFollowing>('following', 'username bio followers following');

    // Usuario privado y que no coincide con el ID del solicitante, contenido bloqueado
    if (!user.isPublic && userID !== user.id) {
        throw new AppError(403, 'Forbidden');
    }

    const formatted = populateFollowingUser.following.map(f => ({
        id: f.id,
        username: f.username,
        bio: f.bio,
        followers: f.followers.length,
        following: f.following.length,
    }));

    return {
        status: 'ok',
        following: formatted,
    }
};

export const getProfile = async (username: string, userID?: string): Promise<GetProfileResponseDTO> => {
    const userProfile = await findUserByUsername(username);

    // Si el perfil es privado
    // Si además el id del solicitante no es igual al del perfil solicitado
    if (!userProfile.isPublic && userID != userProfile.id.toString()) {
        return {
            status: 'ok',
            profile: {
                username: userProfile.username,
            }
        };
    };

    if (userID == userProfile.id.toString()) {
        return {
            status: 'ok',
            profile: {
                username: userProfile.username,
                email: userProfile.email,
                birthdate: userProfile.birthdate,
                bio: userProfile.bio,
                followers: userProfile.followers.length,
                following: userProfile.following.length,
                followRequests: userProfile.followRequests,
            }
        };
    }

    return {
        status: 'ok',
        profile: {
            username: userProfile.username,
            email: userProfile.email,
            birthdate: userProfile.birthdate,
            bio: userProfile.bio,
            followers: userProfile.followers.length,
            following: userProfile.following.length,
        }
    };
};

export const patchProfile = async (userID: string, data: PatchProfileRequestDTO): Promise<PatchProfileResponseDTO> => {
    const updatedProfile = ensureUserExists(
        await UserModel.findByIdAndUpdate<IUser>(userID, {
            birthdate: data.birthdate,
            bio: data.bio,
            isPublic: data.isPublic,
        }, {
            new: true,
        })
    );

    return {
        status: 'updated',
        user: {
            username: updatedProfile.username,
            email: updatedProfile.email,
            birthdate: updatedProfile.birthdate,
            bio: updatedProfile.bio,
        }
    }
};