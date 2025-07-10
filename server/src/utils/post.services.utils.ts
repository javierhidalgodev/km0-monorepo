import { PostResponseDTO } from '@/dtos/get-post.dto';
import { IPost, PopulatePost, PostModel } from '@/models/post.model';
import { IPostsQueryParams } from '@/schemas/post.schema';
import { FilterQuery, Query } from 'mongoose';

export interface PostFilter extends IPostsQueryParams {
    user?: string;
}

export const getPosts = async (
    queryParams?: IPostsQueryParams,
    userID?: string,
): Promise<PopulatePost[]> => {

    const query: FilterQuery<IPost> = {
        $or: [
            { isPublic: true },
            ...(userID ? [{ user: userID }] : []),
        ],
        ...queryParams,
    };

    console.log(query)
    return await PostModel
        .find(query)
        .sort({ createdAt: -1 })
        .populate('user', 'username')
        .lean<PopulatePost[]>();
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
        id: p.id,
        user: {
            id: p.user._id,
            username: p.user.username,
        },
        text: p.text ?? undefined,
        activity: p.activity,
        isPublic: p.isPublic,
        mood: p.mood,
        createdAt: p.createdAt,
    }));
}