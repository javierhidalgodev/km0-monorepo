import { IUser, TPopulateFollowing, UserModel } from '@/models/user.model';
import { CreateUserRequestDTO, CreateUserResponseDTO, LoginRequestDTO, LoginResponseDTO, PatchProfileRequestDTO, PatchProfileResponseDTO, GetProfileResponseDTO, GetUsersFollowersResponseDTO, GetUsersFollowingResponseDTO } from '@/dtos/users.dto';
import { AppError } from '@/utils/app-error';
import { comparePassword, generateToken, hashPassword } from '@/utils/auth.utils';
import { ensureUserExists, findUserByUsername } from '@/utils/user.utils';
import { AUTH_ERRORS } from '@/constants/messages';
import mongoose from 'mongoose';

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

export const getUsersFollowers = async (userID: string, username: string, requestedLimit?: string, cursor?: string): Promise<GetUsersFollowersResponseDTO> => {
    const user = await findUserByUsername(username);

    // Usuario privado y que no coincide con el ID del solicitante, contenido bloqueado
    if (!user.isPublic && userID !== user.id) {
        throw new AppError(403, AUTH_ERRORS.FORBIDDEN_403);
    };

    // Cálculo del mínimo entre el límite solicitado si existe o 10, y 50 como máximo. De esa forma si no llega límite, por defecto se traen 10 registros, y si se intenta llamar a más de 50, se bloquea en 50.
    const parsedLimit = Number(requestedLimit);
    const limit = Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 10, 50);

    // Busca todos los followers relacionados con el id del usuario consultado
    const match: any = {
        _id: { $in: user.followers },
    };

    // Si se envía cursor, se hace a partir de este. Como los id contienen información de timestamps, se devuelven los resultado a partir del siguiente cursor al indicado
    if (cursor) {
        match._id.$gt = new mongoose.Types.ObjectId(cursor);
    }

    // Se recuperan por el match, se ordenan, se aplica el limit deseado más 1, y se seleccionan los campos que se quieren obtener
    const followers = await UserModel
        .find(match)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .select('username bio, followers following');

    const formatted = followers.map(f => ({
        id: f.id,
        username: f.username,
        bio: f.bio,
        followers: f.followers.length,
        following: f.following.length,
    }));

    // Cálculo a partir del número de followers del usuario, y el límite pedido. Si existen más registros, se devuelve en la respuesta un nextCursor desde el que se hará la siguiente petición, si es que se quieren cargar más usuarios (botón)
    const hasMore = formatted.length > limit;

    console.log(requestedLimit, cursor, hasMore);

    return {
        status: 'ok',
        followers: formatted,
        nextCursor: hasMore ? formatted[formatted.length -1].id : undefined,
    }

    // const populateFollowerUser = await user
    //     .populate<TPopulateFollowers>('followers', 'username bio followers following');

    // const formatted = populateFollowerUser.followers.map(f => ({
    //     id: f.id,
    //     username: f.username,
    //     bio: f.bio,
    //     followers: f.followers.length,
    //     following: f.following.length,
    // }));

    // return {
    //     status: 'ok',
    //     followers: formatted,
    // }
};

export const getUsersFollowing = async (userID: string, username: string): Promise<GetUsersFollowingResponseDTO> => {
    const user = await findUserByUsername(username);

    const populateFollowingUser = await user
        .populate<TPopulateFollowing>('following', 'username bio followers following');

    // Usuario privado y que no coincide con el ID del solicitante, contenido bloqueado
    if (!user.isPublic && userID !== user.id) {
        throw new AppError(403, AUTH_ERRORS.FORBIDDEN_403);
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