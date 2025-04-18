import express from 'express';
import * as groupController from '../controllers/groupController.js';
import rateLimit from 'express-rate-limit';
import verifyUserIdentity from '../middlewares/verifyUserIdentity.js';

const router = express.Router();

const createGroupLimiter = rateLimit({
    limit: 3,
    windowMs: 60 * 1000 * 60 * 3,
    message: 'Too many create groups have been created, please try again later.',
    skipFailedRequests: true,
});

const groupSettLimiter = rateLimit({
    limit: 3,
    windowMs: 1000 * 60 * 60 * 12,
    message: 'Too many group change attempts, please try again later.',
    skipFailedRequests: true,
});

const userInviteLimiter = rateLimit({
    limit: 30,
    windowMs: 1000 * 60 * 60 * 6,
    message: 'Too many invites detected, please try again later.',
    skipFailedRequests: true,
});

const changeLeaderLimiter = rateLimit({
    limit: 5,
    windowMs: 1000 * 60 * 60 * 6,
    message: 'Too many change leader request detected, please try again later.',
    skipFailedRequests: true,
});

router.use(verifyUserIdentity);

router.post('/', createGroupLimiter, groupController.createGroupChannel);

router.route('/:groupId').get(groupController.getGroupChannel).delete(groupController.deleteGroup);

router.patch(
    '/:groupId/update',
    groupSettLimiter,
    groupController.uploadGroupPhoto,
    groupController.resizeGroupPhoto,
    groupController.updateGroupDetails
);

router.route('/:groupId/members').get(groupController.getGroupMembers);

router.patch('/:groupId/invite', userInviteLimiter, groupController.inviteMember);

router.patch('/:groupId/changeleader', changeLeaderLimiter, groupController.changeGroupLeader);

export default router;
