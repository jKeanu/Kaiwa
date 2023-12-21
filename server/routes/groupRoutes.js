const express = require('express');
const chatRoutes = require('./chatRoutes')
const authController = require('../controllers/authController')
const groupController = require('../controllers/groupController')

const router = express.Router();

router.use('/messages', chatRoutes)



router.use(authController.protect)
router.route('/')
    .post(groupController.createGroupChannel)

router.route('/:groupId')
    .get(groupController.getGroupChannel)
    .delete(groupController.deleteGroup)

router.route('/:groupId/update')
    .patch(groupController.updateGroupDetails)

router.route('/:groupId/members')
    .get(groupController.getGroupMembers)

router.route('/:groupId/invite')
    .patch(groupController.inviteMember)

router.route('/:groupId/changeleader')
    .patch(groupController.changeGroupLeader)



module.exports= router