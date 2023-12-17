const express = require('express');
const authController = require('../controllers/authController')
const friendController = require('../controllers/friendController')


//The mergeParams enables us to access :userId
const router = express.Router({mergeParams: true});

router.use(authController.protect)
router.use(authController.validateCurrentUser)
router.route('/')
    .get(friendController.getUserFriends)
    .post(friendController.addFriend)

router.route('/:friendId')
    .patch(friendController.acceptFriend)
    .delete(friendController.removeFriend)

module.exports = router