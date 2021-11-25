import express from 'express';
import path from 'path';

//Import array of middleware functions
import middleware from './middleware';

//Get a router from express
let router = express.Router();

//Hook in middleware
router.use(middleware);

router.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, "../dist/web"));
});

//Export the router
export default router;
