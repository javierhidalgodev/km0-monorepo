import { IPost } from "@/models/post.model"
import { TokenPayload } from "../token-payload"
import { IComment } from "@/models/comment.model"

declare global {
    namespace Express {
        export interface Request {
            user?: TokenPayload
            post?: IPost,
            comment?: IComment,
        }
    }
} 