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
FIXME: Give some background about the WiringOP application and the way to build it, and what it produces.

The OrangePi Android OS comes with a pre-installed Android application called WiringOP, which provides a way to explore the different phsyical pins that are located on the SBC.

It allows to read and write to the different pins that are on the board, and allows viewing the state of all the pins.

TODO: Add a Picture of the Icon of the WiringOP in the OrangePi OS.

TODO: Add a Picture of the layout of the WiringOP Android Application.

TODO: Add a Picture of the output of `gpiox readall`

## OrangePi Android OS
FIXME: Give some background about the OrangePi Android OS, where it could be found, and how to download and unpack it.

## WiringOP Internals
FIXME: Give background about the relevant internals of WiringOP, which files are necesseray to copy to our own project, and why it is important to keep the package name `com.example.wiringop` the same in our project as well, and why we need to run the `chmod 666 /dev/mem`.

## Our Project
FIXME: Give a background on which type of project we are creating in Android Studio, why it is an Android library (so it would be possible to use it in Unity), and how the copied files are used in our library.

## Unity
FIXME: describe how this library will be used in Unity. How it should be built, and what do we need to do in Unity player settings to use arm64-v8a.

## Conclusion
FIXME: Summarize the steps that were done. And also propose to take a look into integrating the D-Pad and GPIO solution into Unity's new Input System.
TODO: Update the date at the top of the document.