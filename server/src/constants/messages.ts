export const AUTH_ERRORS = {
    INVALID_TOKEN: 'Invalid token',
    INVALID_CREDENTIALS: 'Invalid credentials',
    EMAIL_IN_USE: 'This email is already in use',
    UNAUTHORIZED_403: 'Unauthorized',
    FORBIDDEN_403: 'Forbidden',
};

export const USER_ERRORS = {
    NOT_FOUND: 'User not found',
};

export const POST_ERRORS = {
    NOT_FOUND: 'Post not found',
}

export const COMMENT_ERRORS = {
    NOT_FOUND: 'Comment not found',
};

export const FOLLOW_ERRORS = {
    ALREADY_FOLLOW: 'This user already follows you',
    NO_REQUESTED_TO_FOLLOW: 'This user does not requested to follow you',
    NOT_FOLLOWING: 'You are not following this user',
    CANNOT_FOLLOW_YOURSELF: 'Cannot follow yourself',
    FOLLOW_REQUEST_PENDING: 'Follow request already pending',
    ALREADY_FOLLOWING: 'Already following',
}

export const FOLLOWER_ERRORS = {
    CANNOT_DELETE_YOURSELF: 'Cannot delete yourself, because you cannot follow yourself',
    NOT_FOLLOWING_YOU: 'This user is not following you',
}