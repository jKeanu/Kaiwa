function isRefreshPayload(payload) {
    const p = payload;
    return typeof p?.userId === 'string' && typeof p?.jti === 'string';
}

export default isRefreshPayload;
