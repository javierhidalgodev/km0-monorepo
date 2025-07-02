/**
 * Lógica interna para la creación de un usuario
 * que no dependa del framework (Express.js)
 */

import { CreateUserRequestDTO, CreateUserResponseDTO } from '@/dtos/create-user.dto';
import { LoginRequestDTO, LoginResponseDTO } from '@/dtos/login-user.dto';
import { ProfileResponseDTO } from '@/dtos/profile.dto';
import { UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { comparePassword, generateToken, hashPassword } from '@/utils/auth';


export const createUser = async (data: CreateUserRequestDTO): Promise<CreateUserResponseDTO> => {
    const { email, password } = data;

    const exists = await UserModel.findOne({ email });

    if (exists) {
        throw new AppError(409, 'Email ya registrado');
    }

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
    }
}

export const loginUser = async (data: LoginRequestDTO): Promise<LoginResponseDTO> => {
    const user = await UserModel.findOne({ email: data.email });

    if (!user) {
        throw new AppError(401, 'Credenciales incorrectas');
    }

    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
        throw new AppError(401, 'Credenciales incorrectas');
    }

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
}

export const getProfile = async (userID: string): Promise<ProfileResponseDTO> => {
    const userProfile = await UserModel.findById(userID).lean();

    if (!userProfile) {
        throw new AppError(404, 'Usuario no encontrado');
    }

    return {
        status: 'ok',
        profile: {
            username: userProfile.username,
            email: userProfile.email,
            birthdate: userProfile.birthdate,
        }
    }
}