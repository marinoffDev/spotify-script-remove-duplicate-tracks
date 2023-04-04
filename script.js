require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const puppeteer = require('puppeteer');
const PLAYLIST_ID = process.env.PLAYLIST_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const YOUR_USERNAME = process.env.YOUR_USERNAME;
const YOUR_PASSWORD = process.env.YOUR_PASSWORD;
const REDIRECT_URI='https://example.com/callback'; // there's no need to edit this
const APP_SCOPES = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-modify-private', 'playlist-modify-public'];
const LIMIT = 100;
const TRACK_POSITIONS = new Map();
const DUPLICATE_TRACKS_POSITIONS = [];
let offset = 0;
let totalTracksInPlaylist = 0;
let numBatches = 0;

const spotifyApi = new SpotifyWebApi({
  redirectUri: REDIRECT_URI,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET
});

async function authorize() {
  console.log('Running script...');
  const AUTHORIZE_URL = spotifyApi.createAuthorizeURL(APP_SCOPES);
  const BROWSER = await puppeteer.launch();
  const PAGE = await BROWSER.newPage();
  await PAGE.goto(AUTHORIZE_URL);
  await PAGE.waitForSelector('#login-username');
  await PAGE.type('#login-username', YOUR_USERNAME);
  await PAGE.type('#login-password', YOUR_PASSWORD);
  await PAGE.click('#login-button');
  await PAGE.waitForNavigation();
  const URL = await PAGE.url();
  const CODE = URL.match(/code=([^&]*)/)[1];
  await BROWSER.close();
  try {
    const DATA = await spotifyApi.authorizationCodeGrant(CODE);
    const ACCESS_TOKEN = DATA.body.access_token;
    spotifyApi.setAccessToken(ACCESS_TOKEN);
    console.log('Authorization complete.');
  } catch (error) {
    console.error('Error authorizing the app:', error);
  }
};

async function determineIterationAmount() {
  await spotifyApi.getPlaylist(PLAYLIST_ID)
    .then(data => {
      totalTracksInPlaylist = data.body.tracks.total;
      numBatches = Math.floor(totalTracksInPlaylist / LIMIT) + 1;
      console.log('\nScanning ' + totalTracksInPlaylist + ' total tracks in playlist.');
    })
};

async function getPlaylistData() {
  for (let j = 0; j < numBatches; j++) {
    await spotifyApi.getPlaylistTracks(PLAYLIST_ID, { offset: offset, limit: LIMIT})
    .then(data => {
      const TRACKS = data.body.items;
      for (let i = 0; i < TRACKS.length; i++) {
        TRACKS[i].position = i + offset;
        const POSITION = TRACKS[i].position;
        const URI = TRACKS[i].track.uri;
        TRACK_POSITIONS.set(POSITION, URI);
      }
    })
    offset = offset + LIMIT;
  };
};

async function checkForDuplicates() {
  const UNIQUE_TRACK_IDS = new Map();
  TRACK_POSITIONS.forEach((value, key) => {
    if (UNIQUE_TRACK_IDS.has(value)) {
      DUPLICATE_TRACKS_POSITIONS.push(key);
    } else {
      UNIQUE_TRACK_IDS.set(value, key);
    }
  });  
};

async function deleteDuplicates() {
  try {
    if (DUPLICATE_TRACKS_POSITIONS.length > 0){
      spotifyApi.getPlaylist(PLAYLIST_ID)
        .then(playlist => {
          const SNAPSHOT_ID = playlist.body.snapshot_id;
          return spotifyApi.removeTracksFromPlaylistByPosition(PLAYLIST_ID, DUPLICATE_TRACKS_POSITIONS, SNAPSHOT_ID);
        })
    } else {
      console.log('No duplicates found');
    }
  } catch (err) {
    console.log(err);
  } finally {
    console.log('\nRemoved ' + DUPLICATE_TRACKS_POSITIONS.length + ' duplicate tracks.\n' + 'Playlist contains ' + Number(totalTracksInPlaylist - DUPLICATE_TRACKS_POSITIONS.length) + ' unique tracks.\n' + '\nFinished.');
  }
};

authorize()
  .then(() => {
    determineIterationAmount()
      .then(() => {
        getPlaylistData()
          .then(() => {
            checkForDuplicates()
              .then(() => {
                deleteDuplicates()
              })
          })
      })
  }).catch((err) => {
    console.log(err);
});