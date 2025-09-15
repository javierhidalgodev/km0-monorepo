import { GetCommentsResponseDTO, CreateCommentRequestDTO, CreateCommentResponseDTO, DeleteCommentResponseDTO, GetSingleCommentResponseDTO } from '@/dtos/comments.dto';
import { CommentModel, IComment, PopulateComment } from '@/models/comment.model';
import { PostModel } from '@/models/post.model';
import { UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { assertCanComment, mapComments } from '@/utils/comment.service.utils';

export const createComment = async (userID: string, postID: string, data: CreateCommentRequestDTO): Promise<CreateCommentResponseDTO> => {
    // 1. La validación de usuario/token se hace con middleware // DEFENSIVO
    const user = await UserModel.findById(userID);
    if (!user) {
        throw new AppError(404, 'User not found');
    }

    // 2. Aquí hago la validación de POST existente (DEFENSIVO)
    // y si el usuario puede comentarlo
    await assertCanComment(postID, userID);

    // 3. E intento hacer la creación del comentario
    const comment = await CommentModel.create({
        user: userID,
        post: postID,
        content: data.content,
    });

    return {
        status: 'created',
        comment: {
            id: comment.id,
            user: comment.user._id.toString(),
            post: comment.post._id.toString(),
            content: comment.content,
            createdAt: comment.createdAt,
        }
    };
};

export const getCommentById = async (commentID: string): Promise<GetSingleCommentResponseDTO> => {
    const comment = await CommentModel
        .findById(commentID)
        .populate('user', 'username')
        .lean<PopulateComment>();

    if (!comment) {
        throw new AppError(404, 'Comment not found');
    };

    const mapComment = mapComments([comment])[0];

    return {
        status: 'ok',
        comment: mapComment,
    };
};

export const getPostComments = async (postID: string): Promise<GetCommentsResponseDTO> => {
    const post = await PostModel.findById(postID);

    if (!post) {
        throw new AppError(404, 'Post not found');
    };

    const comments = await CommentModel
        .find({ post: postID })
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .lean<PopulateComment[]>();

    const mappedComments = mapComments(comments);

    return {
        status: 'ok',
        comments: mappedComments,
    };
};

export const deletePostComment = async (comment: IComment): Promise<DeleteCommentResponseDTO> => {
    await comment.deleteOne();

    return {
        status: 'deleted',
        message: 'Comment deleted successfully',
    };
};