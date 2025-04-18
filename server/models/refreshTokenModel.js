import mongoose, { Schema, Types } from 'mongoose';

const RefreshTokenSchema = new Schema({
    user: {
        type: Types.ObjectId,
        ref: 'User',
        required: [true, 'A refresh token requires an associated user.'],
    },
    tokenId: {
        type: String,
        required: [true, 'A refresh token requires a token.'],
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
});

RefreshTokenSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 24 * 60 * 60 * Number(process.env.REFRESH_COOKIE_EXPIRES_IN) }
);

const RefreshToken = mongoose.model('refreshToken', RefreshTokenSchema);

export default RefreshToken;
