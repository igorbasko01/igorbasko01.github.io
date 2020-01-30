---
layout: post
title: "Adventure with a Rubik's Cube -  Part 1"
date: 2020-01-30 20:55:00 +02:00
categories: rubiks cube
---
For my 34th birthday, I got a [Rubik's Cube](https://en.wikipedia.org/wiki/Rubik%27s_Cube).
And decided that I'm going to solve it by myself. It means, that I will try and come up with an algorithm by myself.

My belief is that it would be a lot easier for me to see all the faces of the cube at once. 
So I have decided to write a simple `HTML5 Canvas` [app](https://github.com/igorbasko01/rubiks-cube), that will spread a cube on the screen and will be interactive.

![The App](/assets/rubiks-app-main.png)

Boy, how wrong was I. First of all, making the rotation of the faces to work properly, is a challenge. 
Second of all, it didn't make the task of coming up with an algorithm any easier.

So to make it easier, I think I need to add some more features to the app. For now, I think about adding the following 
two: Cube Random Shuffling, and Logging the moves on the screen. 

Currently the app supports rotation and coloring the individual cells, except the middle one in each face.

Hope that the next features will help with making some progress towards solving the cube.
