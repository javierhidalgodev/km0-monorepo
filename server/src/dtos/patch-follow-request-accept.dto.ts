export interface AcceptFollowRequestResponseDTO {
    status: 'accepted';
    message: string;
    user: {
        username: string;
        followers: number;
        following: number;
        followRequests: string[];
    };
}