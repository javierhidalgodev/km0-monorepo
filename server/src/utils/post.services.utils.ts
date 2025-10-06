import { PostResponseDTO } from '@/dtos/posts.dto';
import { IPost, PopulatePost, PostModel } from '@/models/post.model';
import { IPostsQueryParams } from '@/schemas/post.schema';
import { FilterQuery, Query } from 'mongoose';
import { AppError } from './app-error';
import { POST_ERRORS } from '@/constants/messages';

export interface PostFilter extends IPostsQueryParams {
    user?: string;
}

export const findPostByID = async (postID: string): Promise<IPost> => {
    const post = await PostModel.findById(postID);

    if (!post) {
        throw new AppError(404, POST_ERRORS.NOT_FOUND);
    };

    return post;
}

export const getPosts = async (
    queryParams?: IPostsQueryParams,
    userID?: string,
): Promise<PopulatePost[]> => {
    const posts = await PostModel
        .find({ ...queryParams })
        .sort({ createdAt: -1 })
        .populate('user', 'username isPublic')
        .lean<PopulatePost[]>();

    return posts.filter(p =>
        p.user._id.toString() === userID || p.user.isPublic
    );
}

export const getMine = async (
    userID: string,
    queryParams?: IPostsQueryParams,
): Promise<PopulatePost[]> => {

    const query: FilterQuery<IPost> = {
        user: userID,
        ...queryParams,
    };

    return await PostModel
        .find(query)
        .sort({ createdAt: -1 })
        .populate('user', 'username')
        .lean<PopulatePost[]>();
}

// Se podrían tipar como Posts[]
export const mapPosts = (posts: PopulatePost[]): PostResponseDTO[] => {
    // const publicPosts = posts.filter(p => p.isPublic);

    return posts.map((p: PopulatePost) => ({
        id: p._id.toString(),
        user: {
            id: p.user._id,
            username: p.user.username,
        },
        text: p.text ?? undefined,
        activity: p.activity,
        mood: p.mood,
        createdAt: p.createdAt,
    }));
}