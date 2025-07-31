import express from 'express';
import healthRoutes from '@/routes/health.routes';
import userRoutes from '@/routes/user.routes';
import { errorHandler } from '@/middlewares/error-handler';
import postRoutes from '@/routes/post.routes';
import commentRoutes from '@/routes/comment.routes';

const app = express();
app.use(express.json());

app.use('/api', healthRoutes);

app.use('/api', postRoutes);
app.use('/api', userRoutes);
app.use('/api', commentRoutes);

app.use(errorHandler);

export default app;