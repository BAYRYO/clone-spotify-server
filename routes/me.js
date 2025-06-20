const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/me', async (req, res) => {
    const accessToken = req.cookies.access_token;

    if (!accessToken) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    try {
        const { data } = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        res.json({
            id: data.id,
            display_name: data.display_name,
            email: data.email,
            product: data.product,
            country: data.country,
            images: data.images,
        });
    } catch (err) {
        const status = err?.response?.status || 500;
        console.error('[GET /me] Spotify API error:', err?.response?.data || err.message);
        res.status(status).json({ error: 'Token invalide ou expiré' });
    }
});

module.exports = router;
