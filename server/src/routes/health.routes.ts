import { Router } from 'express';
import { getHealthStatus } from '@/controllers/health.controller';

const healthRoutes = Router();

healthRoutes.get('/health', getHealthStatus);

export default healthRoutes;