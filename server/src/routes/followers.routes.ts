import { handleDeleteFollower } from "@/controllers/followers.controller";
import { authenticateToken } from "@/middlewares/authenticate-token";
import { Router } from "express";

const followersRoutes = Router();

followersRoutes.delete(
    '/followers/:username',
    authenticateToken(),
    handleDeleteFollower,
);

export default followersRoutes;