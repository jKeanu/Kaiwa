const express = require('express');
const authController = require('../controllers/authController')
const friendController = require('../controllers/friendController')
const groupController = require('../controllers/groupController')

const router = express.Router({mergeParams: true});

router.use(authController.protect)
router.route('/:groupId/leave')
    .delete(groupController.leaveGroup)



module.exports = router