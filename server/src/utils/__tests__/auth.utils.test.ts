import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/app-error';
import * as authModule from '@/utils/auth.utils';
import { IUser } from '@/models/user.model';
import { TokenPayload } from '@/types/token-payload';
import { AUTH_ERRORS } from '@/constants/messages';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const mockJWTSign = jwt.sign as jest.Mock;
const mockJWTVerify = jwt.verify as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('hashPassword', () => {

    it('Se devuelve el hash de la password', async () => {
        mockHash.mockResolvedValue('123456789');

        const result = await authModule.hashPassword('123');

        expect(mockHash).toHaveBeenCalled();
        expect(result).toBe('123456789');

    });

    it('Error de password null', async () => {
        mockHash.mockRejectedValue(new Error('Error de hash'));

        await expect(authModule.hashPassword('pass')).rejects.toThrow(AppError);
    });

});

describe('comparePassword', () => {
    it('Se válida el password con el hash correctamente', async () => {
        mockCompare.mockResolvedValue(true);

        const result = await authModule.comparePassword('123', '123');

        expect(mockCompare).toHaveBeenCalled();
        expect(result).toBe(true);

    });

    it('El password pasado no coincide con el hash y se lanza un AppError', async () => {
        mockCompare.mockRejectedValue(new Error('Passwords do not match'));

        await expect(authModule.comparePassword).rejects.toThrow(AppError);
    });
});

describe('generateToken', () => {
    it('Se pasa el token firmado', () => {
        mockJWTSign.mockReturnValue('esteeseltokenfirmadopapa');

        const result = authModule.generateToken({
            id: '123',
            username: 'demouser',
            email: 'demo@user.es',
        } as IUser);

        expect(mockJWTSign).toHaveBeenCalled();
        expect(result).toBe('esteeseltokenfirmadopapa');
    });

    it('JWT no puede firmar el token', () => {
        mockJWTSign.mockImplementation(() => { throw new Error('No se puede firmar el token') });

        expect(() => authModule.generateToken({
            id: '123',
            username: 'demouser',
            email: 'demo@user.es',
        } as IUser)).toThrow(AppError);
    });
});

describe('verifyToken', () => {
    it('El token se verifica con el secreto', () => {
        mockJWTVerify.mockReturnValue({
            id: '123',
            username: 'demouser',
            email: 'demo@user.es',
        });

        const result = authModule.verifyToken('esteeseltokenpapa');

        expect(mockJWTVerify).toHaveBeenCalled();
        expect(result.id).toBe('123');
    });

    it('No se puede verificar el token', () => {
        mockJWTVerify.mockImplementation(() => { throw new Error('No se puede verificar el token') });

        expect(() => authModule.verifyToken('esteeseltokenpapa')).toThrow(AppError);
        expect(mockJWTVerify).toHaveBeenCalled();
    });
});

describe('extractUserFromAuthHeader', () => {
    it('Si no se pasa un authHeader, y NO ES REQUERIDO, no se devuelve nada', () => {
        expect(authModule.extractUserFromAuthHeader()).toBe(undefined)
    });

    it('Si no se pasa un authHeader, y ES REQUERIDO no se puede procesar la petición', () => {
        expect(() => authModule.extractUserFromAuthHeader(undefined, true)).toThrow(AppError);
    });

    it('Si se pasa el authHeader, se verifica y si es correcto se devuelve', () => {
        jest.spyOn(authModule, 'verifyToken').mockReturnValue({
            id: '123',
            username: 'demouser',
            email: 'demo@user.es',
        });

        const result = authModule.extractUserFromAuthHeader('estaeslacabeceradeauth') as TokenPayload;

        expect(authModule.verifyToken).toHaveBeenCalled();
        expect(result.id).toBe('123');
        expect(result.email).toBe('demo@user.es');
    });

    it('Se pasa el authHeader, pero no se puede verificar', () => {
        jest.spyOn(authModule, 'verifyToken').mockImplementation(() => {
            throw new AppError(401, AUTH_ERRORS.INVALID_TOKEN);
        });

        expect(() => authModule.extractUserFromAuthHeader('estaeslacabaceradeauth')).toThrow(Error);
    });
});