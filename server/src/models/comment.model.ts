import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
    user: Types.ObjectId;
    post: Types.ObjectId;
    content: string;
    createdAt: Date;
};

export type PopulateComment = Omit<IComment, 'user'> & ({
    user: {
        _id: string,
        username: string,
    },
});

const commentSchema = new Schema<IComment>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    content: {
        type: String,
        minlength: 1,
        maxlength: 300,
        required: true,
    },
}, {
    timestamps: {
        createdAt: true,
        updatedAt: false,
    },
});

export const CommentModel = mongoose.model<IComment>('Comment', commentSchema);