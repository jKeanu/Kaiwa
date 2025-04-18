const removeTokens = (res) => {
    const domain =
        process.env.NODE_ENV === 'production' ? process.env.PERMIT_COOKIE_DOMAIN : undefined;
    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'none',
        path: '/api/v1/auth/',
        secure: true,
        domain,
    });
    res.clearCookie('accessToken', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        domain,
    });
};

export default removeTokens;
