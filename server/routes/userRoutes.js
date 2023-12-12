const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController')

const router = express.Router();

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.use(authController.protect)
router.post('/addfriend', userController.addFriend)
router.post('/accept-friend-request', userController.acceptFriend)
router.post('/decline-friend-request', userController.declineFriend)
router.post('/changepassword', authController.changePassword)

module.exports = router