import express from 'express';
import path from 'path';

//Import array of middleware functions
import middleware from './middleware';

//Get a router from express
let router = express.Router();

//Hook in middleware
router.use(middleware);

//Export the router
export default router;
