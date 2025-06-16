import express, {
    type Request,
    type Response,
    type NextFunction
} from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import dotenv from 'dotenv'
import { headers } from './middleware/header'

dotenv.config();



const app = express();

app.use(headers);
app.use(logger('tiny'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())



export default app;