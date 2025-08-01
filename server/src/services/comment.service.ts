import { CreateCommentRequestDTO, CreateCommentResponseDTO } from '@/dtos/create-comment.dto';
import { DeleteCommentResponseDTO } from '@/dtos/delete-comment.dto';
import { GetCommentResponseDTO, GetCommentsResponseDTO } from '@/dtos/get-comments.dto';
import { CommentModel, IComment, PopulateComment } from '@/models/comment.model';
import { PopulatePost, PostModel } from '@/models/post.model';
import { UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { assertCanComment } from '@/utils/comment.service.utils';

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

// Obtención de un solo comentario para su visualización
export const getCommentById = async (commentID: string, userID?: string): Promise<GetCommentResponseDTO> => {
    // 1. Validar que el comentario existe
    const comment = await CommentModel
        .findById(commentID)
        .populate('user', 'username')
        .lean<PopulateComment>();

    if (!comment) {
        throw new AppError(404, 'Comment not found');
    };

    // 2. Comprobar que el post existe, en el caso de que el post
    // haya sido borrado, el comentario podrá existir, pero no el
    // posts en sí, entonces no se devuelve.

    const post = await PostModel.findById(comment.post._id);

    console.log(comment.user);

    if (!post) {
        throw new AppError(404, 'Post not found');
    };

    return {
        id: comment.id,
        user: {
            id: comment.user._id,
            username: comment.user.username,
        },
        postID: post.id,
        comment: comment.content,
        createdAt: comment.createdAt,
    };
};

// Obtención de todos los comentarios de un post
export const getPostComments = async (postID: string): Promise<GetCommentsResponseDTO> => {
    // 1. Validar que el POSTID existe // DEFENSIVO
    const post = await PostModel.findById(postID);

    if (!post) {
        throw new AppError(404, 'Post not found');
    };

    // TODO: se podría externalizar como con la creación de POSTS
    const comments = await CommentModel
        .find({ post: postID })
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .lean<PopulateComment[]>();

    const mappedComments = comments.map<GetCommentResponseDTO>((c: PopulateComment) => {
        return {
            id: c.id,
            user: {
                id: c.user._id,
                username: c.user.username,
            },
            postID: c.post.toString(),
            comment: c.content,
            createdAt: c.createdAt,
        }
    });

    return {
        status: 'ok',
        comments: mappedComments
    };
};

export const deletePostComment = async (comment: IComment): Promise<DeleteCommentResponseDTO> => {
    await comment.deleteOne();

    return {
        status: 'deleted',
        message: 'Comment deleted succesfully',
    };
};