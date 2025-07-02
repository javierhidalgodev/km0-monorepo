export interface GetCommentResponseDTO {
    id: string;
    user: {
        id: string;
        username: string;
    };
    postID: string;
    comment: string;
    createdAt: Date;
};

export type GetCommentsResponseDTO = {
    status: 'ok',
    comments: GetCommentResponseDTO[],
};

