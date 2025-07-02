import { AppError } from '../app-error';
import { hashPassword } from '../auth';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe.skip('Hash de password', () => {

    it('Error de password null', async () => {
        mockBcrypt.hash.mockImplementation(() => {
            throw new AppError(500, 'Error de hash');
        })

        await expect(hashPassword('pass')).rejects.toThrow(AppError);
    });

});