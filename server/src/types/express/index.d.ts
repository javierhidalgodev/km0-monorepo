import { TokenPayload } from '@/types/token-payload'
import { IPost } from '@/models/post.model'
import { IComment } from '@/models/comment.model'

declare global {
    namespace Express {
        export interface Request {
            user?: TokenPayload
            post?: IPost,
            comment?: IComment,
        }
    }
} 