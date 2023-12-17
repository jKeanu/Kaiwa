const express = require('express');
const authController = require('../controllers/authController')
const groupController = require('../controllers/groupController')

const router = express.Router();


router.use(authController.protect)
router.route('/')
    .post(groupController.createGroupChannel)
    .get(groupController.getUserGroups)

router.route('/:groupId')
    .get(groupController.getGroupMembers)
    .patch(groupController.updateGroupDetails)

router.route('/:groupId/invite')
    .patch(groupController.inviteMember)

router.route('/:groupId/leave')
    .patch(groupController.leaveGroup)


module.exports= router