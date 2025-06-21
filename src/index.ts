import * as express from "express"
import * as bodyParser from "body-parser"
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import  Routes  from "./routes/index"
import { User } from "./entities/User"
import * as morgan from "morgan"
import { port } from "./config"
import { handleError } from "./middlewares/main"
import * as cors from "cors"


AppDataSource.initialize().then(async () => {

    // create express app
    const app = express()
    app.use(morgan("combined"))
    app.use(bodyParser.json())

    // register express routes from defined application routes
    Routes.forEach(route => {
        (app as any)[route.method](route.route, async (req: Request, res: Response, next: Function) => {
            try {
                const result = await (new (route.controller as any))[route.action](req, res, next)
                res.json(result)
                if (result instanceof Promise) {
                    result.then(result => result !== null && result !== undefined ? res.send(result) : undefined)
                }
            } catch (error) {
                next(error)
            }
        })
    })

    app.use(handleError)
    app.use(cors())

    // start express server
    app.listen(port)



    console.log(`Express server has started on port ${port}`)

}).catch(error => console.log(error))
