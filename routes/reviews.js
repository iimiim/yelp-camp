const express = require('express');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');

const catchAsync = require('../utils/catchAsync');
const router = express.Router({ mergeParams: true });
const Campground = require('../models/campground');
const Review = require('../models/review');
const reviews = require('../controller/review');
const { campgroundSchema, reviewSchema } = require('../schemas.js');
const ExpressError = require('../utils/ExpressError');

router.post('/', validateReview, catchAsync(reviews.createReview));

router.delete('/:reviewId',isLoggedIn,isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;