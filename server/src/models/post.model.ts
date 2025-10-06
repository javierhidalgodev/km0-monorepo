import mongoose, { Document, Schema, Types } from 'mongoose';

export type TMood = 'excellent' | 'good' | 'regular' | 'bad';
export type TActivity = 'run' | 'walk' | 'other'

export interface IPost extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    createdAt: Date;
    activity: TActivity;
    text?: string;
    mood: TMood;
};

export type PopulatePost = Omit<IPost, 'user'> & {
    user: {
        _id: string,
        username: string,
        isPublic: boolean,
    },
};

const postSchema = new Schema<IPost>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    activity: {
        type: String,
        enum: ['run', 'walk', 'other'],
        required: true,
    },
    text: {
        type: String,
    },
    mood: {
        type: String,
        enum: ['excellent', 'good', 'regular', 'bad'],
        required: true,
    },
}, {
    timestamps: true,
});

export const PostModel = mongoose.model<IPost>('Post', postSchema);