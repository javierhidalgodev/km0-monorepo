import { IUser, UserModel } from "@/models/user.model";
import { ensureUserExists, findUserByID, findUserByUsername } from "../user.utils";
import { AppError } from "../app-error";

jest.mock('@/models/user.model')

const mockFindById = UserModel.findById as jest.Mock;
const mockFindOne = UserModel.findOne as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks()
});

describe('ensureUserExists', () => {
    it('El usuario existe, y se devuelve', async () => {
        const user = {
            username: 'demo',
            email: 'demo@user.com',
            bio: 'la bio',
            birthdate: '2000-02-18',
            id: '123',
        } as IUser;

        const result = ensureUserExists(user);

        expect(result).toBe(user)
    });

    it('El usuario no existe', async () => {
        expect(() => ensureUserExists(null)).toThrow(AppError);
    });
});

describe('findUserByID', () => {
    it('Se encuentra el usuario por el ID y se devuelve', async () => {
        mockFindById.mockResolvedValue({
            id: '123',
            username: 'demouser',
            email: 'demo@user.com',
        });

        const result = await findUserByID('123');

        expect(mockFindById).toHaveBeenCalled();
        expect(result.id).toBe('123');
    });

    it('No se encuentra el usuario por el ID y se devuelve AppError', async () => {
        mockFindById.mockResolvedValue(null);

        await expect(findUserByID('123')).rejects.toThrow(AppError);
    });
});

describe('findUserByUsername', () => {
    it('Se encuentra el usuario por el username y se devuelve', async () => {
        mockFindOne.mockResolvedValue({
            id: '123',
            username: 'demouser',
            email: 'demo@user.com',
        });

        const result = await findUserByUsername('demouser');

        expect(mockFindOne).toHaveBeenCalled();
        expect(result.username).toBe('demouser');
    });

    it('No se encuentra el usuario por el username y se devuelve AppError', async () => {
        mockFindOne.mockResolvedValue(null);

        await expect(findUserByUsername('demouser')).rejects.toThrow(AppError);
    });
});