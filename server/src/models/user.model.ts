import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    birthdate: string;
    isPublic: boolean;
};

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        minlength: 5,
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
    isPublic: {
        type: Schema.Types.Boolean,
        require: true,
        default: true,
    }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);