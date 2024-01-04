import express from 'express';
import * as authController from '../controllers/authController.js';
import * as groupController from '../controllers/groupController.js';

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/:groupId/leave')
    .delete(groupController.leaveGroup);

export default router;