import { GetCommentResponseDTO } from '@/dtos/get-comments.dto';
import { PostResponseDTO } from '@/dtos/get-post.dto';

export interface GetPostDetailResponseDTO extends PostResponseDTO {
    comments: GetCommentResponseDTO[];
};