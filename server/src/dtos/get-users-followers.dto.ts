export type PopulateFollower = {
    id: string,
    username: string,
    bio?: string,
    followers: string[],
    following: string[],
};

export interface GetUsersFollowersResponseDTO {
    status: string;
    followers: {
        id: string,
        username: string,
        bio?: string,
        followers: number,
        following: number,
    }[];
};