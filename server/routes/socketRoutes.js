import express from 'express';
import { getAccessTokenStatus } from '../controllers/socketController.js';
import verifyUserIdentity from '../middlewares/verifyUserIdentity.js';

const router = express.Router();

router.use(verifyUserIdentity);
// So this controller is in  the socket routes, since it's more of a pre-connection security rather
// than authentication.
router.get('/verify-token', getAccessTokenStatus);

export default router;
