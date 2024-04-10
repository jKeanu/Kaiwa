import express from 'express';
import * as authController from '../controllers/authController.js';
import * as groupController from '../controllers/groupController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();


// const createGroupLimiter = rateLimit({
//     limit: 3,
//     windowMs: 60*1000*60*3,
//     message: 'Too many create groups have been created, please try again later.',
//     skipFailedRequests: true
// })

const groupSettLimiter = rateLimit({
    limit: 3,
    windowMs: 1000*60*60*12,
    message: 'Too many group change attempts, please try again later.',
    skipFailedRequests: true,
})

router.use(authController.protect);

router.post('/', 
    groupController.createGroupChannel);

router.route('/:groupId')
    .get(groupController.getGroupChannel)
    .delete(groupController.deleteGroup);

router.patch('/:groupId/update', 
    groupSettLimiter,
    groupController.uploadGroupPhoto, 
    groupController.resizeGroupPhoto, 
    groupController.updateGroupDetails);

router.route('/:groupId/members')
    .get(groupController.getGroupMembers);

router.route('/:groupId/invite')
    .patch(groupController.inviteMember);

router.route('/:groupId/changeleader')
    .patch(groupController.changeGroupLeader);

export default router;