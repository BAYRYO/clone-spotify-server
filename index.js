require('dotenv-safe').config({ example: '.env.example' });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const querystring = require('querystring');

const app = express();
app.use(cors());

const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI,
    FRONTEND_URI
} = process.env;

app.use(cors({
    origin: FRONTEND_URI,
    credentials: true,
}));

// Étape 1 - Redirection vers Spotify
app.get('/login', (req, res) => {
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
    });

    res.redirect(`https://accounts.spotify.com/authorize?${query}`);
});

// Étape 2 - Callback depuis Spotify avec "code"
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            querystring.stringify({
                code,
                redirect_uri: SPOTIFY_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
            {
                headers: {
                    Authorization:
                        'Basic ' +
                        Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token, refresh_token } = response.data;

        // Redirige vers le frontend avec les tokens en query string
        res.redirect(`${FRONTEND_URI}/auth/callback?access_token=${access_token}&refresh_token=${refresh_token}`);
    } catch (error) {
        console.error(error.response.data);
        res.sendStatus(500);
    }
});

// Étape 3 - Refresh token
app.get('/refresh', async (req, res) => {
    const refresh_token = req.query.refresh_token;
    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            }),
            {
                headers: {
                    Authorization: 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Refresh token error:', error?.response?.data || error.message);
        res.sendStatus(500);
    }
});


app.listen(3001, () => {
    console.log('✅ Backend Spotify OAuth ready at http://localhost:3001');
});
