---
layout: post
title: "Flashing Android on Orange Pi 5b with Linux Host"
categories: orangepi android aosp linux
created: 2024-09-03
date: 2024-09-03 00:00:00 +0200
published: false
---
# Writing Tasks
- [x] Write a list of chapters
- [x] Prepare a task for each chapter
- [x] Write the Overview draft
- [x] Write the The Challenge draft
- [ ] Write the rkdevelop Tool draft
- [ ] Write the loader file draft
- [ ] Write the Flashing Addresses draft
- [ ] Write the full process and script draft
- [ ] Write the Conclusion draft
- [ ] Review the Overview draft and finalize it
- [ ] Review the The Challenge draft and finalize it
- [ ] Review the rkdevelop Tool draft and finalize it
- [ ] Review the loader file draft and finalize it
- [ ] Review the Flashing Addresses draft and finalize it
- [ ] Review the full process and script draft and finalize it
- [ ] Review the Conclusion draft and finalize it
- [ ] Update the `date` field to the current date
- [ ] Update the `published` field to `true`

## Overview
In this post I will share with you how to flash an Android OS image on an Orange Pi 5B board using a Linux host.

Which apparently is not that straightforward...

## The Challenge
The [Orange Pi 5B manual](https://drive.google.com/drive/folders/11JLZcvjU1eN6SkJPZ7m9gm6q-_UVtqYd) mentions that building its Android based OS, is done on a Linux host.

The build output is an `update.img` file that is possible to flash to the Orange Pi 5B device using the Windows only methods, through a TF card or a Type-C cable into eMMC.

The proposed approach in the manual for flashing is using different Windows compatible applications, such as `RKDevTool` or `SDDiskTool`.

This approach of building the OS on Linux, but only able to flash on Windows, is an annoying approach as it requires a constant switch between the Linux and the Windows operating systems. Which is very time-consuming and affects the feedback cycle significantly.

I've also tried using Windows' WSL for the build process, but it wasn't able to install part of the required packages.

## The rkdevelop Tool
### What is it?
### How did I installed it on Linux

## The loader file
### What is it?

## The Flashing Addresses
### What are they?
### How did I get them on Windows
### How did I flash them on Linux

## The full process and script

## Conclusion