import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/app-error';
import { IUser } from '@/models/user.model';
import { TokenPayload } from '@/types/token-payload';

const JWT_SECRET = process.env.JWT_SECRET || 'el_que_tengo_aqui_colgado';

export const hashPassword = async (password: string): Promise<string> => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        return hashedPassword;
    } catch (error) {
        throw new AppError(500, `${error}`);
    }
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        throw new AppError(500, 'Error al comparar contraseñas');
    }
}

export const generateToken = (user: IUser): string => {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
    }

    try {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '30m' });
    } catch (error) {
        throw new AppError(500, 'Internal Server Error', { cause: 'JWT' });
    }
}

export const verifyToken = (token: string) => {
    const processedToken = token.split(' ');

    try {
        return jwt.verify(processedToken[1], JWT_SECRET) as TokenPayload;
    } catch (error) {
        throw new AppError(401, 'Token inválido o caducado');
    }
}