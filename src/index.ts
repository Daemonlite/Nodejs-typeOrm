import * as express from "express";
import * as bodyParser from "body-parser";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "./data-source";
import Routes from "./routes/index";
import * as morgan from "morgan";
import { port } from "./config";
import { handleError } from "./middlewares/main";
import * as cors from "cors";

AppDataSource.initialize().then(async () => {
    const app = express();

    // 1. Middleware ordering is important - these should come first
    app.use(cors()); // Enable CORS first
    app.use(morgan("combined")); // Logging
    app.use(bodyParser.json()); // JSON body parsing
    app.use(express.urlencoded({ extended: false })); // URL-encoded body parsing

    // 2. Proper route registration with middlewares
    Routes.forEach(route => {
        const routeMiddlewares = route.middlewares || []; // Default to empty array if no middlewares
        
        (app as any)[route.method](
            route.route,
            ...routeMiddlewares, // Spread the middlewares
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const controllerInstance = new (route.controller as any)();
                    const result = await controllerInstance[route.action](req, res, next);
                    
                    if (result !== null && result !== undefined) {
                        return result;
                    }
                } catch (error) {
                    console.log('inside error catch');
                    next(error);
                }
            }
        );
    });

    // 3. Error handling middleware comes last
    app.use(handleError);

    app.listen(port, () => {
        console.log(`Express server has started on port ${port}`);
    });

}).catch(error => console.log(error));