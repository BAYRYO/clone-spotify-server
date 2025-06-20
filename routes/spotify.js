const express = require('express');
const requireSpotifyAuth = require('../middleware/requireSpotifyAuth');
const router = express.Router();
const axios = require('axios');

router.use(requireSpotifyAuth);

router.get('/me', async (req, res) => {
    try {
        const { data } = await req.spotify.get('me');
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
});

router.get('/me/playlists', async (req, res) => {
    try {
        const { data } = await req.spotify.get('me/playlists');
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des playlists' });
    }
});

router.get('/me/top/tracks', async (req, res) => {
    try {
        const { data } = await req.spotify.get('me/top/tracks?limit=20');
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des top tracks' });
    }
});

router.get('/search', async (req, res) => {
    try {
        const q = req.query.q;
        const { data } = await req.spotify.get(`/search?q=${encodeURIComponent(q)}&type=track&limit=10`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
});

router.get('/me/player', async (req, res) => {
    const accessToken = req.cookies.access_token;

    if (!accessToken) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    try {
        const { data } = await axios.get('https://api.spotify.com/v1/me/player', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        res.json(data);
    } catch (err) {
        const status = err?.response?.status || 500;
        console.error('[GET /me/player] Spotify API error:', err?.response?.data || err.message);
        res.status(status).json({ error: 'Erreur lors de la récupération du player' });
    }
});

router.post('/play', async (req, res) => {
    const accessToken = req.cookies.access_token;
    const { uri } = req.body;

    if (!accessToken) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!uri) {
        return res.status(400).json({ error: 'URI manquante' });
    }

    try {
        await axios.put(
            'https://api.spotify.com/v1/me/player/play',
            { uris: [uri] },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.sendStatus(204); // OK, no content
    } catch (err) {
        const status = err?.response?.status || 500;
        console.error('[POST /play] Spotify API error:', err?.response?.data || err.message);
        res.status(status).json({ error: 'Erreur lors de la lecture de la piste' });
    }
});

router.get('/me/tracks', async (req, res) => {
    const accessToken = req.cookies.access_token;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (!accessToken) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    try {
        const { data } = await axios.get(
            `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        res.json(data);
    } catch (err) {
        const status = err?.response?.status || 500;
        console.error('[GET /me/tracks] Spotify API error:', err?.response?.data || err.message);
        res.status(status).json({ error: 'Erreur lors de la récupération des titres aimés' });
    }
});


module.exports = router;
