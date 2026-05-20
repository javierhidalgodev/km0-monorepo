import { IUser, TPopulateFollowing, UserModel } from '@/models/user.model';
import { CreateUserRequestDTO, CreateUserResponseDTO, LoginRequestDTO, LoginResponseDTO, PatchProfileRequestDTO, PatchProfileResponseDTO, GetProfileResponseDTO, GetUsersFollowersResponseDTO, GetUsersFollowingResponseDTO } from '@/dtos/users.dto';
import { AppError } from '@/utils/app-error';
import { comparePassword, generateToken, hashPassword } from '@/utils/auth.utils';
import { ensureUserExists, findUserByUsername, mapFollowers } from '@/utils/user.utils';
import { AUTH_ERRORS } from '@/constants/messages';
import mongoose from 'mongoose';
import { getPagination, parseRequestLimit } from '@/utils/pagination.utils';

export const createUser = async (data: CreateUserRequestDTO): Promise<CreateUserResponseDTO> => {
    const { email, password } = data;

    const exists = await UserModel.findOne({ email });

    if (exists) {
        throw new AppError(409, AUTH_ERRORS.EMAIL_IN_USE);
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
        throw new AppError(401, AUTH_ERRORS.INVALID_CREDENTIALS);
    };

    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
        throw new AppError(401, AUTH_ERRORS.INVALID_CREDENTIALS);
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

/**
 * 1. Preguntar si el perfil NO es público + NO coincide el id de la petición con el id del usuario loggeado
 * 2. Parsear el límite de resultados pedidos
 * 3. Construir un matcher para encontrar los followers del usuario.
 * 4. Si la petición incluye un cursor, añadirlo al matcher para encontrar en la BBDD los resultados por MAYORES (gt) al cursor proporcionado (los cursores de Mongo son timestamps)
 * 5. Con todo esto hacer la consulta a la base de datos (match + sort + limit + select)
 * 6. Transformar la data para devolverla en el formato esperado por la UI
 * 7. Responder
 */

export const getUsersFollowers = async (userID: string, username: string, requestedLimit?: string, cursor?: string): Promise<GetUsersFollowersResponseDTO> => {
    const user = await findUserByUsername(username);

    if (!user.isPublic && userID !== user.id) {
        throw new AppError(403, AUTH_ERRORS.FORBIDDEN_403);
    };

    const limit = parseRequestLimit(requestedLimit);

    const match: any = {
        _id: { $in: user.followers },
    };

    if (cursor) {
        match._id.$gt = new mongoose.Types.ObjectId(cursor);
    }

    const followers = await UserModel
        .find(match)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .select('username bio followers following');

    const { itemsToReturn, nextCursor } = getPagination<IUser>(followers, limit, (item) => item.id);

    const formatted = mapFollowers(itemsToReturn);

    return {
        status: 'ok',
        followers: formatted,
        nextCursor,
    }
};

export const getUsersFollowing = async (
    userID: string,
    username: string,
    requestedLimit?: string,
    cursor?: string
): Promise<GetUsersFollowingResponseDTO> => {
    const user = await findUserByUsername(username);

    if (!user.isPublic && userID !== user.id) {
        throw new AppError(403, AUTH_ERRORS.FORBIDDEN_403);
    }

    const limit = parseRequestLimit(requestedLimit);

    const match: any = {
        _id: { $in: user.following },
    };

    if (cursor) {
        match._id.$gt = new mongoose.Types.ObjectId(cursor);
    };

    const following = await UserModel
        .find(match)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .select('username bio followers following');


    const { itemsToReturn, nextCursor } = getPagination<IUser>(following, limit, (item) => item.id);

    const formatted = mapFollowers(itemsToReturn);


    return {
        status: 'ok',
        following: formatted,
        nextCursor
    }
};

export const getProfile = async (username: string, userID?: string): Promise<GetProfileResponseDTO> => {
    const userProfile = await findUserByUsername(username);

    // Perfil privado solicitado por usuario NO propietario
    if (!userProfile.isPublic && userID != userProfile.id.toString()) {
        return {
            status: 'ok',
            profile: {
                username: userProfile.username,
            }
        };
    };

    const profile = {
        username: userProfile.username,
        email: userProfile.email,
        birthdate: userProfile.birthdate,
        bio: userProfile.bio,
        followers: userProfile.followers?.length,
        following: userProfile.following?.length,
    }

    // Perfil privado solicitado por usuario propietario
    if (userID == userProfile.id.toString()) {
        return {
            status: 'ok',
            profile: {
                ...profile,
                followRequests: userProfile.followRequests,
            }
        };
    }

    return {
        status: 'ok',
        profile,
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
