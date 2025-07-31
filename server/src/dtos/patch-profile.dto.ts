import { patchProfileSchema } from "@/schemas/user.schema";
import { z } from "zod";

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