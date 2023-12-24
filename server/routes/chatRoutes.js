const express = require('express');
const chatController = require('../controllers/chatController')

const router = express.Router({mergeParams: true});

router.route('/')
    .post(chatController.sendMessage)

module.exports = router