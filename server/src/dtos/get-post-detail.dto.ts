import { GetCommentResponseDTO } from './get-comments.dto';
import { PostResponseDTO } from './get-post.dto';

export interface GetPostDetailResponseDTO extends PostResponseDTO {
    comments: GetCommentResponseDTO[];
};