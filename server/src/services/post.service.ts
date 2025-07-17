import { CreatePostRequestDTO, CreatePostResponseDTO } from '@/dtos/create-post.dto';
import { GetPostsResponseDTO } from '@/dtos/get-post.dto';
import { IPost, PopulatePost, PostModel } from '@/models/post.model';
import { UserModel } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { getMine, getPosts, mapPosts, PostFilter } from '@/utils/post.services.utils';
import { IPostsQueryParams } from '@/schemas/post.schema';
import { DeletePostResponseDTO } from '@/dtos/delete-post.dto';
import { GetPostDetailResponseDTO } from '@/dtos/get-post-detail.dto';
import { CommentModel, PopulateComment } from '@/models/comment.model';
import { mapComments } from '@/utils/comment.service.utils';

export const createPost = async (userID: string, data: CreatePostRequestDTO): Promise<CreatePostResponseDTO> => {
    const user = await UserModel.findById(userID);

    if (!user) {
        throw new AppError(404, 'Usuario no encontrado');
    };

    const post = await PostModel.create({
        user: user.id,
        ...data
    });

    return {
        status: 'created',
        post: {
            id: post.id,
            user: {
                id: user.id,
                username: user.username,
            },
            text: post.text ?? undefined,
            activity: post.activity,
            mood: post.mood,
            createdAt: post.createdAt,
        },
    };
};

export const getAllPosts = async (
    queryParams?: IPostsQueryParams,
    userID?: string
): Promise<GetPostsResponseDTO> => {
    const posts = await getPosts(queryParams, userID);
    const mappedPosts = mapPosts(posts);

    return {
        status: 'ok',
        posts: mappedPosts,
    };
}

// TODO: revisar que funcione bien para traer todos los posts propios
export const getPostsMine = async (
    userID: string,
    queryParams?: IPostsQueryParams
): Promise<GetPostsResponseDTO> => {
    const posts = await getMine(userID, queryParams);

    const mappedPosts = mapPosts(posts);

    return {
        status: 'ok',
        posts: mappedPosts,
    };
};

export const getPostDetail = async (postID: string, userID?: string): Promise<GetPostDetailResponseDTO> => {
    const post = await PostModel.findById(postID)
        .populate<PopulatePost>('user', 'username isPublic');

    if (!post) {
        throw new AppError(404, 'Post not found');
    };

    if (!post.user.isPublic && (!userID || userID !== post.user._id.toString())) {
        throw new AppError(403, 'Unauthorized');
    }

    const comments = await CommentModel.find({ post: post.id })
        .populate('user', 'username')
        .lean<PopulateComment[]>();

    const mappedComments = mapComments(comments);

    return {
        id: post.id,
        user: {
            id: post.user._id.toString(),
            username: post.user.username,
        },
        text: post.text,
        activity: post.activity,
        mood: post.mood,
        comments: mappedComments,
        createdAt: post.createdAt,
    };
};

// Mine
// export const getPostMineDetail

export const deletePost = async (post: IPost): Promise<DeletePostResponseDTO> => {
    await post.deleteOne();

    return {
        status: 'deleted',
        message: 'Post deleted successfully',
    };
};