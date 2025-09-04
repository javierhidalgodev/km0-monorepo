export type PopulateFollowing = {
    id: string,
    username: string,
    bio?: string,
    followers: string[],
    following: string[],
};

export interface GetUsersFollowingResponseDTO {
    status: string;
    following: {
        id: string,
        username: string,
        bio?: string,
        followers: number,
        following: number,
    }[];
};