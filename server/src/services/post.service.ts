import { IPost, PopulatePost, PostModel } from '@/models/post.model';
import { CommentModel, PopulateComment } from '@/models/comment.model';
import { IPostsQueryParams } from '@/schemas/post.schema';
import { CreatePostRequestDTO, CreatePostResponseDTO, GetPostsResponseDTO, GetPostDetailResponseDTO, DeletePostResponseDTO } from '@/dtos/posts.dto';
import { findPostByID, getMine, getPosts, mapPosts } from '@/utils/post.utils';
import { AppError } from '@/utils/app-error';
import { mapComments } from '@/utils/comment.utils';
import { findUserByID } from '@/utils/user.utils';
import { AUTH_ERRORS } from '@/constants/messages';

export const createPost = async (userID: string, data: CreatePostRequestDTO): Promise<CreatePostResponseDTO> => {
    const user = await findUserByID(userID);

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
    const post = await findPostByID(postID)

    const populatePost = await post.populate<PopulatePost>('user', 'username isPublic');

    if (!populatePost.user.isPublic && (!userID || userID !== populatePost.user._id.toString())) {
        throw new AppError(403, AUTH_ERRORS.UNAUTHORIZED_403);
    }

    const comments = await CommentModel.find({ post: post.id })
        .populate('user', 'username')
        .lean<PopulateComment[]>();

    const mappedComments = mapComments(comments);

    return {
        id: populatePost.id,
        user: {
            id: populatePost.user._id.toString(),
            username: populatePost.user.username,
        },
        text: populatePost.text,
        activity: populatePost.activity,
        mood: populatePost.mood,
        comments: mappedComments,
        createdAt: populatePost.createdAt,
    };
};

export const deletePost = async (post: IPost): Promise<DeletePostResponseDTO> => {
    await post.deleteOne();

    return {
        status: 'deleted',
        message: 'Post deleted successfully',
    };
};