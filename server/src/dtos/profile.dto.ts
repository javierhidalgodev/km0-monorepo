export interface ProfileResponseDTO {
    status: 'ok';
    profile: {
        username: string;
        email?: string;
        birthdate?: string;
        bio?: string;
        followers?: number;
    };
};