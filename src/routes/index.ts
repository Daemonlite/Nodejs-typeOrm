import { userRoutes } from './userRoutes'
import { postRoutes } from './PostRoutes'
import { commentRoutes } from './commentRoutes'

const Routes = [
    ...userRoutes,
    ...postRoutes,
    ...commentRoutes,
]

export default Routes