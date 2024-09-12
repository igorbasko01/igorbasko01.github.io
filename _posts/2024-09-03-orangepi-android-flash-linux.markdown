---
layout: post
title: "Flashing Android on Orange Pi 5B with Linux Host"
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
- [x] Write the rkdevelop Tool draft
- [x] Write the loader file draft
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
The Orange Pi 5B has a Rockchip SoC, and Rockchip provides a tool called [`rkdeveloptool`](https://github.com/rockchip-linux/rkdeveloptool) which allows flashing OS images to the device.

The issue was that I couldn't find any information on how to use this tool to flash an Android OS image to the Orange Pi 5B device. Or any similar information. 

To install the `rkdeveloptool` on Ubuntu, I've used the following commands:
```shell
sudo apt-get update
sudo apt-get install -y libudev-dev libusb-1.0-0-dev dh-autoreconf pkg-config libusb-1.0 build-essential git wget
git clone https://github.com/rockchip-linux/rkdeveloptool
cd rkdeveloptool
wget https://patch-diff.githubusercontent.com/raw/rockchip-linux/rkdeveloptool/pull/73.patch
wget https://patch-diff.githubusercontent.com/raw/rockchip-linux/rkdeveloptool/pull/85.patch
git am *.patch
autoreconf -i
./configure
make -j $(nproc)
```

## The loader file
Before it is possible to flash the OS image to the Orange Pi 5B device, it is necessary to flash a loader file to the device.

The loader file could be found here: [Orange Pi 5B loader file](https://docs.radxa.com/en/rock5/rock5b/low-level-dev/maskrom/linux).
This file is used to boot the device into a mode where it is possible to flash the OS image to it.

It will be loaded as part of the flashing process. Command details will be provided in the next chapters.

## The Flashing Addresses
### What are they? How the update.img is constructed from several images.
### How did I get them on Windows
### How did I flash them on Linux

## The full process and script

## Conclusion