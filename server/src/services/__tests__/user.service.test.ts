import { UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { comparePassword, generateToken, hashPassword } from '@/utils/auth.utils';
import { createUser, getProfile, getUsersFollowers, getUsersFollowing, loginUser, patchProfile } from '@/services/user.service';
import { ensureUserExists, findUserByUsername } from '@/utils/user.utils';
import { AUTH_ERRORS } from '@/constants/messages';

jest.mock('@/models/user.model');
jest.mock('@/utils/auth.utils');
jest.mock('@/utils/user.utils');

const mockFindOne = UserModel.findOne as jest.Mock;
const mockFindByIdAndUpdate = UserModel.findByIdAndUpdate as jest.Mock;
const mockCreate = UserModel.create as jest.Mock;
const mockCompare = comparePassword as jest.Mock;
const mockGenerateToken = generateToken as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;
const mockFindUserByUsername = findUserByUsername as jest.Mock;
const mockEnsureUserExists = ensureUserExists as jest.Mock;

beforeAll(() => {
    jest.clearAllMocks()
});

describe('createUser (mocked)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('crear usuario si no existe', async () => {
        mockFindOne.mockResolvedValue(null);
        mockCreate.mockResolvedValue({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
        });

        const result = await createUser({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });

        expect(result).toEqual({
            status: 'created',
            user: {
                username: 'demo_user',
                email: 'demo@mail.com',
                birthdate: '1990-01-01',
            }
        });

        expect(mockFindOne).toHaveBeenCalledWith({ email: 'demo@mail.com' });
        expect(mockCreate).toHaveBeenCalled();
    });

    it('lanzar AppError si el email ya está registrado', async () => {
        mockFindOne.mockResolvedValue({ email: 'demo@mail.com' });

        await expect(
            createUser({
                username: 'demo_user',
                email: 'demo@mail.com',
                birthdate: '1990-01-01',
                password: '123456',
            })
        ).rejects.toThrow(AppError);

        expect(mockCreate).not.toHaveBeenCalledWith();
    });

    it('lanzar AppError si no se puede hacer hash de la password', async () => {
        mockFindOne.mockResolvedValue(null);
        mockHashPassword.mockRejectedValue(new AppError(500, 'bcrypted failed'));

        await expect(
            createUser({
                username: 'demo_user',
                email: 'demo@mail.com',
                birthdate: '1990-01-01',
                password: '',
            })
        ).rejects.toThrow(AppError);

        expect(mockFindOne).toHaveBeenCalledWith({ email: 'demo@mail.com' });
        expect(mockHashPassword).toHaveBeenCalledWith('');
        expect(mockCreate).not.toHaveBeenCalledWith();
    });
});

describe('loginUser (mocked', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('login exitoso', async () => {
        mockFindOne.mockResolvedValue({
            id: '684d66c89230e5415fab0c50',
            username: 'demo_user',
            email: 'demo@mail.com',
        })
        mockCompare.mockResolvedValue(true);
        mockGenerateToken.mockReturnValue('estoestutoken');

        const result = await loginUser({
            email: 'demo@mail.com',
            password: '123456',
        });

        expect(result).toEqual({
            status: 'logged',
            token: 'estoestutoken',
            user: {
                id: '684d66c89230e5415fab0c50',
                username: 'demo_user',
                email: 'demo@mail.com',
            },
        });
        expect(result.token).toEqual('estoestutoken');
    });

    it('lanza AppError porque no encuentra el email que se pide', async () => {
        mockFindOne.mockResolvedValue(null);

        await expect(loginUser({
            email: 'demo@mail.com',
            password: '123456',
        })).rejects.toThrow(AppError);

        expect(mockFindOne).toHaveBeenCalledWith({ email: 'demo@mail.com' });
        expect(mockCompare).not.toHaveBeenCalled();
    })

    it('lanza AppError porque las contraseñas no coinciden', async () => {
        mockFindOne.mockResolvedValue({
            id: '684d66c89230e5415fab0c50',
            username: 'demo_user',
            email: 'demo@mail.com',
            password: '123456',
        });
        mockCompare.mockResolvedValue(false);

        await expect(loginUser({
            email: 'demo@mail.com',
            password: '12345',
        })).rejects.toThrow(AppError);

        expect(mockFindOne).toHaveBeenCalledWith({ email: 'demo@mail.com' });
        expect(mockCompare).toHaveBeenCalledWith('12345', '123456');
    });
});

describe('getUsersFollowers', () => {
    it('devuelve los seguidores formateados de un usuario público', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            isPublic: true,
            populate: jest.fn().mockResolvedValue({
                followers: [{
                    id: '234',
                    username: 'follower',
                    followers: ['3', '4'],
                    following: ['6']
                }]
            }),
        });

        const result = await getUsersFollowers('999', 'demo_user');

        expect(result.status).toBe('ok');
        expect(result.followers).toHaveLength(1);
        expect(result.followers[0]).toMatchObject({
            id: '234',
            username: 'follower',
            followers: 2,
            following: 1
        });
    });

    it('lanza un AppError si el usuario no es público y el id del solicitante no coincide con el del perfil solicitado', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            isPublic: false,
            populate: jest.fn(),
        });

        await expect(getUsersFollowers('1233', 'demo_user'))
            .rejects.toThrow(new AppError(403, AUTH_ERRORS.FORBIDDEN_403));
    });

    it('permite el acceso a los datos de seguidores de un perfil privado, si el usuario propietario es quien pide los datos', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            isPublic: false,
            populate: jest.fn().mockResolvedValue({
                followers: [{
                    id: '234',
                    username: 'follower',
                    followers: ['3', '4'],
                    following: ['6']
                }]
            }),
        });

        const result = await getUsersFollowers('123', 'demo_user');

        expect(result.status).toBe('ok');
        expect(result.followers).toHaveLength(1);
        expect(result.followers[0]).toMatchObject({
            id: '234',
            username: 'follower',
            followers: 2,
            following: 1
        });
    })
});

describe('getUsersFollowing', () => {
    it('devuelve los usuarios seguidos', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            isPublic: true,
            populate: jest.fn().mockResolvedValue({
                following: [{
                    id: '456',
                    username: 'following',
                    followers: ['7', '8', '10'],
                    following: ['2', '5']
                }]
            }),
        });

        const result = await getUsersFollowing('999', 'demo_user');

        expect(result.status).toBe('ok');
        expect(result.following).toHaveLength(1);
        expect(result.following[0]).toMatchObject({
            id: '456',
            username: 'following',
            followers: 3,
            following: 2
        });
    });

    it('lanza un AppError si el usuario no es público y el id del solicitante no coincide con el del perfil solicitado', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            isPublic: false,
            populate: jest.fn(),
        });

        await expect(getUsersFollowing('1233', 'demo_user'))
            .rejects.toThrow(new AppError(403, AUTH_ERRORS.FORBIDDEN_403));
    });

    it('permite el acceso a los datos de seguidos de un perfil privado, si el usuario propietario es quien pide los datos', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            isPublic: false,
            populate: jest.fn().mockResolvedValue({
                following: [{
                    id: '888',
                    username: 'following',
                    followers: ['3'],
                    following: ['6', '10']
                }]
            }),
        });


        const result = await getUsersFollowing('123', 'demo_user');

        expect(result.status).toBe('ok');
        expect(result.following).toHaveLength(1);
        expect(result.following[0]).toMatchObject({
            id: '888',
            username: 'following',
            followers: 1,
            following: 2
        });
    })
});

describe('getProfile', () => {
    it('Se obtiene el perfil PRIVADO RECORTADO, solicitado por un usuario NO PROPIETARIO', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            isPublic: false,
            followers: [],
            following: ['888'],
        });

        const result = await getProfile('demo_user', '234');

        expect(result.status).toBe('ok');
        expect(result.profile).toHaveProperty('username');
        expect(result.profile.username).toBe('demo_user');
        expect(result.profile).not.toHaveProperty('following');
    });

    it('Se obtiene el perfil PRIVADO COMPLETO, solicitado por un usuario PROPIETARIO', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            email: 'user@demo.com',
            isPublic: false,
            followers: [],
            following: ['888'],
            followRequests: ['21', '43'],
        });

        const result = await getProfile('demo_user', '123');

        expect(result.profile).toHaveProperty('followRequests');
        expect(result.profile).toHaveProperty('followers');
        expect(result.profile.followers).toBe(0);
        expect(result.profile).toHaveProperty('following');
        expect(result.profile.following).toBe(1);
    });

    it('Se obtiene el perfil PÚBLICO COMPLETO, solicitado por quien sea', async () => {
        mockFindUserByUsername.mockResolvedValue({
            id: '123',
            username: 'demo_user',
            email: 'user@demo.com',
            isPublic: true,
            followers: ['32', '56'],
            following: ['888'],
        });

        const result = await getProfile('demo_user');
        // const result = await getProfile('demo_user', '12345s');

        expect(result.profile).toHaveProperty('followers');
        expect(result.profile.followers).toBe(2);
        expect(result.profile).toHaveProperty('following');
        expect(result.profile.following).toBe(1);
    })
});

describe('patchProfile', () => {
    it('El usuario se actualiza correctamente', async () => {
        const mockUser = {
            username: 'demo_user',
            email: 'user@demo.com',
            bio: 'bio actualizada',
            birthdate: '2000-08-12'
        };

        mockFindByIdAndUpdate.mockResolvedValue(mockUser);
        mockEnsureUserExists.mockReturnValue(mockUser);

        const response = await patchProfile('123', { bio: 'bio actualizada' });
        console.log(response)

        expect(response.status).toBe('updated');
        expect(response.user).not.toHaveProperty('id');
        expect(response.user.bio).toBe('bio actualizada');
    });

    it('', async () => {

    });
});