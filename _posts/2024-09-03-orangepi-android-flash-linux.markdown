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
- [x] Write the Flashing Addresses draft
- [x] Write the full process and script draft
- [x] Write the Conclusion draft
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

## The Flashing Process
As part of building the Android OS, there are several images that are created:
1. `uboot.img`
2. `misc.img`
3. `dtbo.img`
4. `vbmeta.img`
5. `boot.img`
6. `recovery.img`
7. `baseparameter.img`
8. `super.img`

As part of the build process they all are combined into a single `update.img` file using RKImageMaker tool. 
It is done automatically by the build process, so we don't need to worry about it. 

Each image has its own responsibility and is flashed to a specific address on the device. 
I might cover the responsibilities of each image in a separate post.

For now we just need to know that we need all of them to flash the OS to the device.

On Windows the flashing process is described in detail in the Orange Pi 5B manual.
But there is no description on how to flash the Android OS on a Linux host.

Fortunately we can look at the logs of the Windows flashing process and see
that behind the scenes the Windows tool is splitting the `update.img` back to the
individual images and flashing them to the device one by one using specific addresses.

I found out the following addresses for each image:
1. `uboot.img` - 0x4000
2. `misc.img` - 0x9000
3. `dtbo.img` - 0xb000
4. `vbmeta.img` - 0xd000
5. `boot.img` - 0xd800
6. `recovery.img` - 0x3f800
7. `baseparameter.img` - 0x1f7800
8. `super.img` - 0x1f8000

Now using the `rkdeveloptool` we can flash the images to the device.
Example command for flashing the `uboot.img` to the device:
```shell
sudo rkdeveloptool wl 0x4000 uboot.img
```

## The Full Process
So basically the full process is pretty simple. 
After building the Android OS we need to do the following steps:
1. Put the device into maskrom mode - It is done by holding the maskrom button on the board while powering the device on.
2. Flash the loader file to the device - `sudo rkdeveloptool db rk3588_spl_loader_v1.15.113.bin`
3. Flash the individual images to the device using specific addresses - `sudo rkdeveloptool wl <address> <image_path>`
4. Reboot the device - `sudo rkdeveloptool rd`

After that the device should boot into the flashed Android OS.

I've also prepared a bash script that automates the flashing process, 
which also does some basic validations before it starts the flashing process.

The full script:
```bash
#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <folder_path>"
    exit 1
fi

# Set the folder path from the input parameter
FOLDER_PATH=$1

# Check if the folder exists
if [ ! -d "$FOLDER_PATH" ]; then
    echo "Error: Folder '$FOLDER_PATH' does not exist."
    exit 1
fi

# the loader file should be located in the current directory.
LOADER="$(pwd)/rk3588_spl_loader_v1.15.113.bin"

# Define the images and their offsets
declare -A IMAGES=(
    [uboot.img]=0x4000
    [misc.img]=0x9000
    [dtbo.img]=0xb000
    [vbmeta.img]=0xd000
    [boot.img]=0xd800
    [recovery.img]=0x3f800
    [baseparameter.img]=0x1f7800
    [super.img]=0x1f8000
)

# Check if the loader file exists
if [ ! -f "$LOADER" ]; then
    echo "Error: Loader file '$LOADER' does not exist."
    exit 1
fi

# Check if a device in Maskrom mode is connected
DEVICE_INFO=$(sudo rkdeveloptool ld | grep "Maskrom")

if [ -z "$DEVICE_INFO" ]; then
    echo "No device in Maskrom mode detected. Please connect the device and ensure it is in Maskrom mode."
    exit 1
else
    echo "Device in Maskrom mode detected: $DEVICE_INFO"
fi

# Check if all required image files are available
for IMAGE in "${!IMAGES[@]}"; do
    IMAGE_PATH="$FOLDER_PATH/$IMAGE"
    if [ ! -f "$IMAGE_PATH" ]; then
        echo "Error: Required image file '$IMAGE_PATH' is missing."
        exit 1
    fi
done

echo "All required image files are present."

# Load the loader
echo "Loading the loader from $LOADER..."
sudo rkdeveloptool db $LOADER

# Flash each image
for IMAGE in "${!IMAGES[@]}"; do
    OFFSET=${IMAGES[$IMAGE]}
    IMAGE_PATH="$FOLDER_PATH/$IMAGE"
    
    # Check if the image file exists
    if [ -f "$IMAGE_PATH" ]; then
        echo "Flashing $IMAGE at offset $OFFSET..."
        sudo rkdeveloptool wl $OFFSET $IMAGE_PATH
    else
        echo "Warning: Image file '$IMAGE_PATH' not found, aborting."
        exit 1
    fi
done

# Reboot the device
echo "Rebooting the device..."
sudo rkdeveloptool rd

echo "Flashing process completed."
```

## Conclusion
Now after we are able to flash the Android OS on a Linux host, the feedback cycles are much faster and the development process is much smoother.
In my experience it reduced my cognitive load and allowed me to focus more on the development process itself. 
And solving the actual problems, rather than wasting a lot of time on switching between the operating systems and remembering what I was doing and what I wanted to do. 

Thanks for reading.