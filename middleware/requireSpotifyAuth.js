const axios = require('axios');

module.exports = async function requireSpotifyAuth(req, res, next) {
    const accessToken = req.cookies.access_token;
    if (!accessToken) return res.status(401).json({ error: 'Non authentifié' });

    try {
        req.spotify = axios.create({
            baseURL: 'https://api.spotify.com/v1/',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        next();
    } catch (err) {
        console.error('[auth middleware] Spotify auth failed:', err.message);
        res.sendStatus(401);
    }
};
