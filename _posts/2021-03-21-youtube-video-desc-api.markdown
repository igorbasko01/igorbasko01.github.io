---
layout: post
title:  "Using YouTube's API to download video description"
date:   2021-03-21 00:00:00 +0200
categories: youtube google python
---
## Overview
I recently have started following a recipes channel on YouTube. The thing that
is missing for me, is that I can't search for recipes with specific ingredients.
Luckily the videos description contains the ingredients. So I was
thinking about downloading the descriptions of all the videos. And then cataloging
them somewhere for easier search.

In this post, I will show you how I have downloaded all the descriptions of all
the videos in the channel using Google's Youtube API, Python and the `requests` package.

## API
First of all to use Youtube's API, we need to onboard it in [Google Cloud Console](https://console.cloud.google.com/).
Under `APIs & Services` choose `Library`, search for `YouTube Data API`, in my case it
was version 3 (v3), choose it and enable it.

After that we need to create an API Key (for the naive solution). We can find it under
the credentials tab.

When we have the key in hand, we can move to the next section and start calling the API.
In my case I have used Python for that with the [requests](https://requests.readthedocs.io/en/master/) package.

## Fetching metadata
As I have already mentioned, the whole idea of that mini project was to fetch the descriptions of
the videos from a specific channel. There were two endpoints that I had to use in order
to fetch the descriptions.

The first one, was to fetch all the video IDs of that channel, and then for each
video to fetch the description.

The first endpoint that I have used, was the [search](https://developers-dot-devsite-v2-prod.appspot.com/youtube/v3/docs/search/list#type).
Using this one, I was able to fetch all the video IDs.
I have used the following URL:
```python
url = f'https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&type=video&channelId={channel_id}&key={self.api_key}'
```
The parameters that I have used in the request were:
1. `part=snippet` - Specifies that I want to have a snippet of the data of the results. It is what the documentation asks to use.
2. `maxResults=50` - The number of results to return. 50 is the max.
3. `type=video` - What type of results are we interested in. In my case it was only videos. Otherwise it might return playlists.
4. `channelId={channel_id}` - The results for a specific channel.
5. `key={api_key}` - The API key that we have created earlier.

In my case the the amount of videos in the channel was greater than 50, so I had to
use `nextPageToken` which contains the ID for the next page of the results. So my subsequent
search requests used `pageToken={next_page}`.

The result of the search request also contained a description for each video that it returned,
but it was an abbreviated one, so I had to use another endpoint to fetch the whole description
of each video.

For each result, I have created a list of video IDs using the following list comprehension:
```python
video_ids = [
            search_result['id']['videoId']
            for search_result in response['items']
            if 'videoId' in search_result['id']
        ]
```
And using the [videos](https://developers-dot-devsite-v2-prod.appspot.com/youtube/v3/docs/videos/list) endpoint,
I would pass the list of IDs to get the result with the full description.
```python
url = f'https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id={",".join(video_ids)}&key={self.api_key}'
```
The parameters in this case were:
1. `part=snippet` - As in the search request.
2. `id={",".join(video_ids)}` - A comma separated video IDs list.
3. `key={api_key}` - The API key that we have created earlier, the same one we used in the search request.
The result of this request contained a result for each video that was passed with its full description.

And that is basically what I did to fetch the descriptions of all the videos of a channel.

Thanks for reading !
