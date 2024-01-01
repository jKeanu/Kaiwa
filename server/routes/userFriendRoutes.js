const express = require('express');
const authController = require('../controllers/authController')
const friendController = require('../controllers/friendController')



const router = express.Router();

router.use(authController.protect)
// router.use(authController.validateCurrentUser)
router.route('/')
    .get(friendController.getUserFriends)
    .post(friendController.addFriend)

router.route('/:friendId')
    .get(friendController.getFriend)

router.route('/:friendId/unfriend')
    .delete(friendController.unfriend)

router.route('/:friendId/decline')
    .delete(friendController.declineFriend)

router.route('/:friendId/accept')
    .patch(friendController.acceptFriend)

module.exports = router