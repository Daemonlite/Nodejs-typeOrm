import { authMiddleware,rateLimitMiddleware } from "../middlewares/main";
import { PostsController } from "../controller/PostsController";

export const postRoutes = [
    {
        method: "get",
        route: "/posts",
        controller: PostsController,
        action: "fetchAllPosts",
        middlewares: [authMiddleware]
    },
    {
        method: "get",
        route: "/posts/:id",
        controller: PostsController,
        action: "retrievePostsById",
        middlewares: [authMiddleware] 
    },
    {
        method: "get",
        route: "/users/:id/posts",
        controller: PostsController,
        action: "fetchUserPost",
        middlewares: [authMiddleware]
    },
    {
        method: "post",
        route: "/posts",
        controller: PostsController,
        action: "createPost",
        middlewares: [authMiddleware] 
    },
    {
        method: "patch",
        route: "/posts/:id",
        controller: PostsController,
        action: "updatePost",
        middlewares: [authMiddleware] 
    },
    {
        method: "delete",
        route: "/posts/:id",
        controller: PostsController,
        action: "deletePost",
        middlewares: [authMiddleware] 
    },
    
]