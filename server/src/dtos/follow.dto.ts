export interface FollowRequestResponseDTO {
    status: 'followed' | 'pending',
    message: string,
}

export interface AcceptFollowRequestResponseDTO {
    status: 'accepted';
    message: string;
    user: {
        username: string;
        followers: number;
        following: number;
        followRequests: string[];
    };
};

export interface RejectFollowRequestResponseDTO {
    status: 'rejected';
    message: string; // Follow request from ${username} rejected
};

export interface DeleteUnfollowResponseDTO {
    status: string;
    message: string;
}

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