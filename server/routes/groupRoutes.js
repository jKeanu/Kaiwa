const express = require('express');
const authController = require('../controllers/authController')
const groupController = require('../controllers/groupController')

const router = express.Router();


router.use(authController.protect)
router.route('/')
    .post(groupController.createGroupChannel)

router.route('/:groupId')
    .get(groupController.getGroupMembers)
    .delete(groupController.deleteGroup)

router.route('/:groupId/update').patch(groupController.updateGroupDetails)

router.route('/:groupId/members')
    .get(groupController.getGroupMembers)

router.route('/:groupId/invite')
    .patch(groupController.inviteMember)



module.exports= router