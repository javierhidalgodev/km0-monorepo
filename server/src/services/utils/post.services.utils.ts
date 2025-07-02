import { PostResponseDTO } from "../../dtos/get-post.dto";
import { PopulatePost, PostModel } from "../../models/post.model";
import { IPostsQueryParams } from "../../schemas/post.schema";

export interface PostFilter extends IPostsQueryParams {
    user?: string;
}

// TODO: revisar porqué paso el userID ¿para recuperar comentarios de un usuario concreto?
export const getPosts = async (queryParams?: IPostsQueryParams, userID?: string): Promise<PopulatePost[]> => {
    const filter: Partial<PostFilter> = {};

    if (userID) {
        filter.user = userID
    }

    if (queryParams) {
        if (queryParams.activity) filter.activity = queryParams.activity
        if (queryParams.mood) filter.mood = queryParams.mood
    }

    // if(queryParams) {
    //     Object.entries(queryParams).forEach(([ key, value ]) => {
    //         filter[key] = value;
    //     });
    // }

    return await PostModel
        .find(filter)
        .sort({ createdAt: -1 })
        .populate('user', 'username')
        .lean<PopulatePost[]>();
}

// Se podrían tipar como Posts[]
export const mapPosts = (posts: PopulatePost[]): PostResponseDTO[] => {
    return posts.map((p: PopulatePost) => ({
        id: p.id,
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