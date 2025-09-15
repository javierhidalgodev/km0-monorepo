import { PopulateComment } from '@/models/comment.model';
import { PopulatePost, PostModel } from '@/models/post.model';
import { AppError } from './app-error';
import { MappedComment } from '@/dtos/comments.dto';

export const mapComments = (comments: PopulateComment[]): MappedComment[] => {
    return comments.map<MappedComment>((c: PopulateComment) => {
        return ({
            id: c._id.toString(),
            user: {
                id: c.user._id.toString(),
                username: c.user.username
            },
            postID: c.post.toString(),
            comment: c.content,
            createdAt: c.createdAt,
        });
    });
};

export const assertCanComment = async (postID: string, userID: string): Promise<void> => {
    const post = await PostModel
        .findById(postID)
        .populate('user', 'isPublic')
        .lean<PopulatePost>();

    if (!post) {
        throw new AppError(404, 'Post not found');
    }

    if (!post.user.isPublic && post.user._id.toString() !== userID) {
        throw new AppError(403, 'Forbidden');
    }
}