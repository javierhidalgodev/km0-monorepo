import { UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { comparePassword, extractUserFromAuthHeader, generateToken, verifyToken } from '@/utils/auth';
import { createUser, loginUser } from '@/services/user.service';

// v.1

jest.mock('@/models/user.model');
jest.mock('@/utils/auth');

const mockFindOne = UserModel.findOne as jest.Mock;
const mockCreate = UserModel.create as jest.Mock;
const mockCompare = comparePassword as jest.Mock;
const mockGenerateToken = generateToken as jest.Mock;
const mockVerifyToken = verifyToken as jest.Mock;
const mockExtractUserFromAuthHeader = extractUserFromAuthHeader as jest.Mock;


beforeAll(() => {
    jest.clearAllMocks()
})

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

// v.0

// const data = {
//     username: 'test_user',
//     password: '123456',
//     email: 'test@demo.mail',
//     birthdate: '2020-10-10',
// }

// beforeEach(() => {
//     clearFakeUserDB();
// })

// describe('createUser', () => {
//     it('debe crear un usuario con datos válidos', () => {
//         const result = createUser(data);

//         expect(result).toEqual({
//             status: 'created',
//             user: {
//                 username: 'test_user',
//                 email: 'test@demo.mail',
//                 birthdate: '2020-10-10'
//             }
//         });
//     });

//     it('lanza un error si el email es invalido', () => {
//         const dataErr = {
//             ...data,
//             email: 'testdemo.mail'
//         }

//         expect(() => createUser(dataErr)).toThrow('Email inválido');
//     });

//     it('lanza un error si el email es invalido ya existe', () => {
//         createUser(data);

//         expect(() => createUser(data)).toThrow(AppError);
//         expect(() => createUser(data)).toThrow('This email is already in use');
//     });
// });