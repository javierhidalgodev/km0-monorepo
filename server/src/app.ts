import express from 'express';
import { errorHandler } from '@/middlewares/error-handler';
import healthRoutes from '@/routes/health.routes';
import userRoutes from '@/routes/user.routes';
import postRoutes from '@/routes/post.routes';
import commentRoutes from '@/routes/comment.routes';
import followRoutes from './routes/follow.routes';
import followersRoutes from './routes/followers.routes';

const app = express();
app.use(express.json());

app.use('/api', healthRoutes);

app.use('/api', postRoutes);
app.use('/api', followRoutes);
app.use('/api', followersRoutes);
app.use('/api', userRoutes);
app.use('/api', commentRoutes);

app.use(errorHandler);

export default app;