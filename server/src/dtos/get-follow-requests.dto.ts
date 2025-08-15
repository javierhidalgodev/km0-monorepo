export type FollowRequest = {
    id: string,
    username: string,
    bio?: string,
    isPublic: boolean,
};

export interface GetFollowRequestsResponseDTO {
    status: string;
    followRequests: FollowRequest[];
};