import bcrypt from 'bcrypt';
import { AppError } from '@/utils/app-error';
import { hashPassword } from '@/utils/auth';

jest.mock('bcrypt');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Hash de password', () => {

    it('Error de password null', async () => {
        mockBcrypt.hash.mockImplementation(() => {
            throw new AppError(500, 'Error de hash');
        })

        await expect(hashPassword('pass')).rejects.toThrow(AppError);
    });

});