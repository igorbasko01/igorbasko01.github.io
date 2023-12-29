---
    layout: post
    title: "Handling GPIOs Made Easy on OrangePI Android"
    categories: orangepi kotlin gpio
    created: 2023-12-25
    date: 2023-12-25 00:00:00 +0200
    published: false
---
## Overview
Recently, I embarked on an exciting project that merges the realms of hardware and software: creating a custom D-pad controller for a Unity-based game, specifically designed to run on a Single Board Computer (SBC). My choice of hardware? The powerful yet cost-effective OrangePI.

As for the operating system, I opted for Android OS. This decision was driven by the seamless compatibility and performance it offers with the Unity game engine.

While the specifics of the game itself are intriguing, this blog post will primarily focus on the technical side of things. Specifically, we'll explore how to handle GPIOs on the OrangePI Android OS and how this functionality can be integrated within a Unity game.

Join me as I delve into the nuts and bolts of interfacing physical game controls with sophisticated software. I'll share insights and practical steps for anyone looking to embark on a similar venture with their Unity projects on an unconventional gaming setup.

## OrangePi Background
In my quest for the ideal SBC for this project, I settled on the OrangePi 5B, a choice driven by its impressive performance capabilities — both in terms of CPU and GPU — and its comparatively low cost.

The OrangePi 5B is equipped with an 8-core CPU and the ARM Mali-G610 GPU, a combination that offers substantial power for demanding applications. This power is further complemented by an onboard NPU, an exciting feature that opens doors for future projects, potentially involving advanced computing tasks like machine learning.

Another appealing aspect of the OrangePi 5B is its integrated WIFI and Bluetooth functionality. This not only allows for versatile communication options with the device but also paves the way for interesting future explorations in wireless connectivity.

The board typically runs on OrangePi OS (Druid), an Android-based operating system. This was a key factor in my decision, as I planned to develop a game using Unity. The Android platform is known for its compatibility with Unity, promising a smoother development process and optimal performance for the game.

In summary, the OrangePi 5B struck me as an excellent choice — a robust, feature-rich board available at a competitive price, ideal for both my current needs and future experimentation.

## WiringOP
WiringOP is a pre-installed Android application on the OrangePi Android OS, serving as a gateway to exploring the physical pins of the SBC. It provides functionalities to read and write to these pins, offering a visual representation of their states.

One notable feature of the WiringOP app is a button that displays the state of all the pins, essentially mirroring the output of the command-line instruction gpiox readall. The resulting display looks something like this:

```shell
+------+-----+----------+------+---+  OPi H6  +---+------+----------+-----+------+
 | GPIO | wPi |   Name   | Mode | V | Physical | V | Mode | Name     | wPi | GPIO |
 +------+-----+----------+------+---+----++----+---+------+----------+-----+------+
 |      |     |     3.3V |      |   |  1 || 2  |   |      | 5V       |     |      |
 |  230 |   0 |    SDA.1 |  OFF | 0 |  3 || 4  |   |      | 5V       |     |      |
 |  229 |   1 |    SCL.1 |  OFF | 0 |  5 || 6  |   |      | GND      |     |      |
 |  228 |   2 |     PWM1 |  OFF | 0 |  7 || 8  | 0 | OFF  | PD21     | 3   | 117  |
 |      |     |      GND |      |   |  9 || 10 | 0 | OFF  | PD22     | 4   | 118  |
 |  120 |   5 |    RXD.3 | ALT4 | 0 | 11 || 12 | 0 | OFF  | PC09     | 6   | 73   |
 |  119 |   7 |    TXD.3 | ALT4 | 0 | 13 || 14 |   |      | GND      |     |      |
 |  122 |   8 |    CTS.3 |  OFF | 0 | 15 || 16 | 0 | OFF  | PC08     | 9   | 72   |
 |      |     |     3.3V |      |   | 17 || 18 | 0 | OFF  | PC07     | 10  | 71   |
 |   66 |  11 |   MOSI.0 | ALT4 | 0 | 19 || 20 |   |      | GND      |     |      |
 |   67 |  12 |   MISO.0 | ALT4 | 0 | 21 || 22 | 0 | OFF  | RTS.3    | 13  | 121  |
 |   64 |  14 |   SCLK.0 | ALT4 | 0 | 23 || 24 | 0 | ALT4 | CE.0     | 15  | 69   |
 |      |     |      GND |      |   | 25 || 26 | 0 | OFF  | PH03     | 16  | 227  |
 +------+-----+----------+------+---+----++----+---+------+----------+-----+------+
 | GPIO | wPi |   Name   | Mode | V | Physical | V | Mode | Name     | wPi | GPIO |
 +------+-----+----------+------+---+  OPi H6  +---+------+----------+-----+------+
```

From this table, two columns are particularly important: `wPi` and `V`. The `wPi` number is crucial for interacting with the pins through software, as it's used to reference a pin's state. The `V` column, on the other hand, indicates whether current is flowing through a pin, which is vital for setting or resetting it.

After some experimentation with WiringOP, it became clear that if the app could read and write to the pins, there should be a way to replicate this functionality in my own Android application. But how to achieve this was not immediately obvious.

My initial search for resources or discussions online didn't yield straightforward answers. So, I pivoted to a more direct approach: diving into the source code of WiringOP itself. Given that WiringOP came pre-installed with the fresh installation of OrangePi OS, I surmised that it was bundled with the OS. This realization kicked off my search into the depths of OrangePI's Android OS source code, hoping to uncover the mechanisms that make WiringOP work as it does.

## OrangePi Android OS
FIXME: Talk a bit about why we would like to get the OrangePi Android OS source code, and why I wasn't able to use the WiringOp straight from github. Give some background about the OrangePi Android OS, where it could be found, and how to download and unpack it.

One alternative approach that I wanted to investigate was to look in the [WiringOP github repository](https://github.com/orangepi-xunlong/wiringOP). The problem there is that I wasn't able to understand how I compile the code such it will provide me with access from the Android Kotlin code to the pins on the board. Also the issues sections didn't contain anything useful.

So without any other available approaches I went with downloading the OrangePi Android OS source code. Which actually is available through their site. The actual source code is compressed into multiple `tar.gz` files. All those files are located in their Google Drive account at the following location: [RK3588S_Android_Source_Code](https://drive.google.com/drive/folders/14efL7SWZ68CZCbUayngLL4iAtGQoV9a0).

After downloading all the files we need to combine them together into a single file, and then extract it contents. This procedure takes a while.

The commands:
1. Combining into a single file - `cat Android_12.tar.gz* > Android_12.tar.gz`
2. Extracting the contents - `tar -xvf Android_12.tar.gz`

Please note that if you are doing it on Windows, then you can use [Cygwin](https://cygwin.com/) to have the `tar` command.

The process of extracting is a lengthy one, so patience is required.

After everything was extracted, now we can look for the `WiringOP` application. And as expected it could be located in the following path: `packages/`

## WiringOP Internals
FIXME: Give background about the relevant internals of WiringOP, how to build it, which files are necesseray to copy to our own project, and why it is important to keep the package name `com.example.wiringop` the same in our project as well, and why we need to run the `chmod 666 /dev/mem`.

## Our Project
FIXME: Give a background on which type of project we are creating in Android Studio, why it is an Android library (so it would be possible to use it in Unity), and how the copied files are used in our library.

## Unity
FIXME: describe how this library will be used in Unity. How it should be built, and what do we need to do in Unity player settings to use arm64-v8a.

## Conclusion
FIXME: Summarize the steps that were done. And also propose to take a look into integrating the D-Pad and GPIO solution into Unity's new Input System.
TODO: Update the date at the top of the document.