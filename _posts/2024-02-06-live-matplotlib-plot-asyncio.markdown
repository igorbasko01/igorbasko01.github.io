---
  layout: post
  title: "Bridging Async and Sync: Plotting Async Data with matplotlib"
  categories: matplotlib python asyncio
  created: 2024-02-06
  date: 2024-02-06 00:00:00 +0200
  published: false
---

## Overview

In my recent project, I aimed to visualize data from a Bluetooth Low Energy (BLE) device, a task that required
integrating different technologies. The `bleak` library was my choice for managing BLE communications in Python, known for
its robust support for these devices.

The challenge arose when I wanted to plot this data using `matplotlib`, a library that excels in data visualization but
operates synchronously. Since `bleak` operates asynchronously, I faced the task of finding a way to bridge these two
different operational modes.

`matplotlib`, while powerful, necessitates execution on the main thread—a requirement that complicates its use with
asynchronous data streams like those from `bleak`. This scenario highlighted a common issue in software development:
integrating synchronous and asynchronous systems in a seamless manner.

## Solution

The solution that I have eventually used was to run the `asyncio` event loop on a separate thread, and run the plotting
on the main thread.

In this section I will detail how I did it.

I wanted to make the solution as simple as possible, but still get the information from "outside", so I decided to
use `zmq` for simulating data communication between the BLE device and the plotting application. I used the `aiozmq`
library for the async `zmq` implementation.

## Conclusion