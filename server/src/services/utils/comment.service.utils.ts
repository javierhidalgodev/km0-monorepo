import { GetCommentResponseDTO } from '@/dtos/get-comments.dto';
import { PopulateComment } from '@/models/comment.model';

export const mapComments = (comments: PopulateComment[]): GetCommentResponseDTO[] => {
    return comments.map<GetCommentResponseDTO>((c: PopulateComment) => {
        return ({
            id: c.id,
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