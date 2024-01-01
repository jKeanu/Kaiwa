const express = require('express');
const authController = require('../controllers/authController')
const channelController = require('../controllers/channelController')


const router = express.Router();

router.use(authController.protect)

router.route('/')
    .get(channelController.getUserChannel)


module.exports = router