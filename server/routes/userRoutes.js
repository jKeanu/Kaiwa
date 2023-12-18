const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController')
const friendRoute = require('./friendRoutes')
const userGroupRoute = require('./userGroupRoutes')

const router = express.Router();

router.use('/:userId/friends', friendRoute)
router.use('/:userId/groups', userGroupRoute)

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.use(authController.protect)

router.patch('/changepassword', authController.changePassword)


module.exports = router