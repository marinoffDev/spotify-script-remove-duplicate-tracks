# Spotify API script for removing duplicate tracks from a playlist 

## Description:
TL;DR: This script scans a Spotify playlist and deletes any duplicate tracks.

## Context:
You're probably wondering "wait, why is this even needed"?

Personally, I use IFTTT applets (https://ifttt.com/) to keep track multiple Spotify playlists at once and "dump" any newly added tracks to my own separate playlist for future discovery/listening. I find this method works great, since the personalized/auto-generated playlists that Spotify provides (e.g. Discover Weekly) often have excellent suggestions, but now there is no rush to listen to everything before it gets wiped.

However, the downside is that often when a song is popular, Spotify adds it to multiple playlists, therefore the "dump" playlist I use gets filled with multiple copies of the same track.
This is why I created this script to help me automate the cleanup process, since over time I ended up having a playlist with ~5k tracks of which (~1.5k were duplicates).

## Prerequisites:
You'll need [Node.JS](https://nodejs.org/) installed and also provide your own [Spotify API key](https://developer.spotify.com/documentation/web-api).

## License
This repository is licensed under the GPL-3.0 license. See the [LICENSE](LICENSE) file for more information.