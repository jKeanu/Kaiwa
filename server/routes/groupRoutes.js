import express from 'express';
import * as authController from '../controllers/authController.js';
import * as groupController from '../controllers/groupController.js';

const router = express.Router();

router.use(authController.protect);

router.route('/')
    .post(groupController.createGroupChannel);

router.route('/:groupId')
    .get(groupController.getGroupChannel)
    .delete(groupController.deleteGroup);

router.patch('/:groupId/update', 
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