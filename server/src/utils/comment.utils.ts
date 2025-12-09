import { PopulateComment } from '@/models/comment.model';
import { PopulatePost } from '@/models/post.model';
import { MappedComment } from '@/dtos/comments.dto';
import { findPostByID } from './post.utils';
import { AppError } from '@/utils/app-error';
import { AUTH_ERRORS } from '@/constants/messages';

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
    const post = await findPostByID(postID);

    const populatePost = await post
        .populate<PopulatePost>('user', 'isPublic');

    if (!populatePost.user.isPublic && populatePost.user._id.toString() !== userID) {
        throw new AppError(403, AUTH_ERRORS.FORBIDDEN_403);
    }
}