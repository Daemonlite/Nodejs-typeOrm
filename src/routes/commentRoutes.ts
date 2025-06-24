import { authMiddleware,rateLimitMiddleware } from "../middlewares/main";
import { CommentsController } from "../controller/CommentsController";


export const commentRoutes = [
    {
        method: "post",
        route: "/comments",
        controller: CommentsController,
        action: "createComment",
        middlewares : [authMiddleware,rateLimitMiddleware]
    },

    {
        method: "delete",
        route: "/comments/:id",
        controller: CommentsController,
        action: "removeComment",
        middlwares: [authMiddleware]
    },
]