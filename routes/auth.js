const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();

const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI,
    FRONTEND_URI,
} = process.env;

const requestSpotifyToken = async (data) => {
    return axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(data),
        {
            headers: {
                Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );
};

// 🔐 Étape 1 - Redirection avec `state` anti-CSRF
router.get('/login', (req, res) => {
    const state = crypto.randomUUID();
    res.cookie('spotify_auth_state', state, {
        httpOnly: true,
        secure: false, // true en production (HTTPS)
        sameSite: 'Lax',
        maxAge: 300000,
    });

    const scope = [
        'user-read-private',
        'user-read-email',
        'user-top-read',
        'user-library-read',
        'user-library-modify',
        'streaming',
        'user-read-playback-state',
        'user-modify-playback-state',
    ].join(' ');

    const query = querystring.stringify({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: SPOTIFY_REDIRECT_URI,
        scope,
        state,
    });

    res.redirect(`https://accounts.spotify.com/authorize?${query}`);
});

// ✅ Étape 2 - Callback + validation state + setCookie
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    const storedState = req.cookies.spotify_auth_state;

    if (!state || state !== storedState) {
        return res.status(403).send('State mismatch. Auth aborted.');
    }

    try {
        const response = await requestSpotifyToken({
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            grant_type: 'authorization_code',
        });

        const { access_token, refresh_token, expires_in } = response.data;

        res.clearCookie('spotify_auth_state');

        // Stocker en cookie sécurisé
        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // mettre à true en HTTPS prod
            sameSite: 'Lax',
            maxAge: 3600 * 1000,
        });

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.send(`
        <html>
        <body>
            <script>
            window.opener?.postMessage({
                type: 'spotify_tokens',
                accessToken: ${JSON.stringify(access_token)}
            }, '${FRONTEND_URI}');
            window.close();
            </script>
        </body>
        </html>
        `);
    } catch (error) {
        console.error('Callback error:', error?.response?.data || error.message);
        res.status(500).send('Erreur lors de l\'authentification avec Spotify');
    }
});

// ♻️ Étape 3 - Refresh
router.get('/refresh', async (req, res) => {
    const refresh_token = req.cookies?.refresh_token;

    if (!refresh_token) {
        return res.status(401).json({ error: 'Aucun refresh token fourni' });
    }

    try {
        const response = await requestSpotifyToken({
            grant_type: 'refresh_token',
            refresh_token,
        });

        const { access_token } = response.data;
        res.json({ access_token });
    } catch (error) {
        console.error('Refresh token error:', error?.response?.data || error.message);
        res.sendStatus(500);
    }
});


module.exports = router;
