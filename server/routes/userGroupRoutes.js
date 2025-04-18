import express from 'express';
import * as groupController from '../controllers/groupController.js';
import verifyUserIdentity from '../middlewares/verifyUserIdentity.js';

const router = express.Router({ mergeParams: true });

router.use(verifyUserIdentity);

router.route('/:groupId/leave').delete(groupController.leaveGroup);

export default router;
