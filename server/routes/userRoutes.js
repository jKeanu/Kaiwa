const express = require('express');
const authController = require('../controllers/authController')
const userController = require('../controllers/userController')
const friendRoute = require('./friendRoutes')
const userGroupRoute = require('./userGroupRoutes')

const router = express.Router();

router.use('/:userId/groups', userGroupRoute)

router.post('/register', authController.signup)
router.post('/login', authController.login)
router.use(authController.protect)

router.patch('/updateMe', userController.updateUser)
router.patch('/changepassword', authController.changePassword)

module.exports = router