import { z } from 'zod';
import { createUserSchema } from '@/schemas/user.schema';
import { loginSchema } from '@/schemas/user.schema';
import { patchProfileSchema } from '@/schemas/user.schema';

export type CreateUserRequestDTO = z.infer<typeof createUserSchema>;

export interface CreateUserResponseDTO {
    status: 'created';
    user: {
        username: string;
        email: string;
        birthdate: string;
    };
};

export type LoginRequestDTO = z.infer<typeof loginSchema>;

export interface LoginResponseDTO {
    status: 'logged';
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
};

export interface GetProfileResponseDTO {
    status: 'ok';
    profile: {
        username: string;
        email?: string;
        birthdate?: string;
        bio?: string;
        followers?: number;
        following?: number;
        followRequests?: string[];
    };
};

export type PatchProfileRequestDTO = z.infer<typeof patchProfileSchema>;

export interface PatchProfileResponseDTO {
    status: 'updated';
    user: {
        username: string;
        email: string;
        birthdate: string;
        bio?: string;
    };
}

export type PopulateUser = {
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

export interface GetUsersFollowingResponseDTO {
    status: string;
    following: {
        id: string,
        username: string,
        bio?: string,
        followers: number,
        following: number,
    }[];
};