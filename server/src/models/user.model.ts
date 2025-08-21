import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    birthdate: string;
    bio: string;
    isPublic: boolean;
    followers: string[];
    followRequests: string[];
    following: string[];
};

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        minlength: 3,
        maxlength: 20,
        trim: true,
        unique: true,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    birthdate: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        maxlength: 400,
        trim: true
    },
    isPublic: {
        type: Schema.Types.Boolean,
        require: true,
        default: true,
    },
    followers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }
    ],
    followRequests: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }
    ],
    following: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }
    ],
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);