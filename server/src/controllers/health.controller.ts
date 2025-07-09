import { Request, Response } from 'express';
import { getHealthMessage } from '@/services/health.service';

export const getHealthStatus = (_req: Request, res: Response) => {
    const message = getHealthMessage();
    res.status(200).json(message);
};