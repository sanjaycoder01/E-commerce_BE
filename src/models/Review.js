const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    comment: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product

// Update product ratings when a review is saved/updated/deleted
reviewSchema.statics.calculateProductRatings = async function(productId) {
    const stats = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: '$product',
                ratingsCount: { $sum: 1 },
                ratingsAverage: { $avg: '$rating' }
            }
        }
    ]);

    try {
        const Product = mongoose.model('Product');
        await Product.findByIdAndUpdate(productId, {
            ratingsCount: stats[0]?.ratingsCount || 0,
            ratingsAverage: stats[0]?.ratingsAverage ? Math.round(stats[0].ratingsAverage * 10) / 10 : 0
        });
    } catch (error) {
        console.error('Error updating product ratings:', error);
    }
};

// Post-save hook to update product ratings
reviewSchema.post('save', function() {
    this.constructor.calculateProductRatings(this.product);
});

// Post-remove hook to update product ratings
reviewSchema.post(/^findOneAndDelete|findOneAndRemove/, async function(doc) {
    if (doc) {
        await doc.constructor.calculateProductRatings(doc.product);
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
