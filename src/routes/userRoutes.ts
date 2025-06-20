import { UserController } from "../controller/UserController"
import { authMiddleware } from "../middlewares/main"

export const userRoutes = [{
    method: "get",
    route: "/users",
    controller: UserController,
    action: "fetchAllUsers",
    middlewares: [authMiddleware]
}, {
    method: "get",
    route: "/users/:id",
    controller: UserController,
    action: "RetrieveUser"
}, {
    method: "post",
    route: "/users",
    controller: UserController,
    action: "saveUser"
}, {
    method: "delete",
    route: "/users/:id",
    controller: UserController,
    action: "removeUser",
    middlewares: [authMiddleware]
}, {
    method: "post",
    route: "/users/login",
    controller: UserController,
    action: "loginUser"
}, {
    method: "post",
    route: "/users/:id",
    controller: UserController,
    action: "updatePassword",
    middlewares: [authMiddleware]
},
{
    method: "post",
    route: "/users/forgot-password",
    controller: UserController,
    action: "forgotPassword"
},
{
    method: "post",
    route: "/users/verify-otp",
    controller: UserController,
    action: "verifyOTP"
}
]