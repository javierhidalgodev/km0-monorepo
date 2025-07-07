import mongoose from 'mongoose';

export const generateObjectId = (): string => {
    return new mongoose.Types.ObjectId().toString();
}