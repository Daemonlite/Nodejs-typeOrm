import { userRoutes } from './userRoutes'
import { postRoutes } from './PostRoutes'

const Routes = [
    ...userRoutes,
    ...postRoutes
]

export default Routes