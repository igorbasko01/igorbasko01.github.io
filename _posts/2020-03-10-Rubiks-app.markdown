---
layout: post
title: "Adventure with a Rubik's Cube -  Part 2"
date: 2020-03-10 13:00:00 +02:00
categories: rubiks cube
---
Well I had some progress with my Rubik's Cube web app, 
since my last [post]({% post_url 2019-12-17-solving-rubiks-1 %}) here.
Since then, I was able to add two new features: a random shuffle 
and moves logging.
The result could be shown at the end of the post.
Unfortunately, I wasn't able to play with it too much since then, so
I didn't make any progress on solving the cube by myself.

The reason I wanted to add logging to the app, is to see the moves that
I should do after a random shuffle of the cube. It means that I can
retrace the moves that where made in the opposite order with the counter
rotation. Hoped it would help me to find some patterns, but didn't had 
much time to spend on playing around with it.

The other nice thing is the random shuffling that is currently does only
3 random rotations. After executing the random shuffle, the interesting
part is to think which rotations were made, and counter them. This one
I found pretty fun to play with. Of course it is possible to shuffle 
more than once, and achieve a higher degree of difficulty.

My next planed two features are going to be: 
1. Displaying Mirrored Faces
2. Changing the number of random shuffling rotations.

Hope that after both those features are done 
I would really have some progress towards solving it. 

{% include index.html %}