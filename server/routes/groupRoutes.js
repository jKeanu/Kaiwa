const express = require('express');
const authController = require('../controllers/authController')
const friendController = require('../controllers/friendController')
const groupController = require('../controllers/groupController')

const router = express.Router({mergeParams: true});
router.use(authController.protect)

router.use(authController.validateCurrentUser)
router.route('/')
    .post(groupController.createGroupChannel)
    .get(groupController.getUserGroups)

router.route('/:groupId')
    .get(groupController.getGroupMembers)
    .patch(groupController.inviteMember)

router.route('/:groupId/leave')
    .patch(groupController.leaveGroup)


module.exports= router