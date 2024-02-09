---
layout: post
title: "Bridging Async and Sync: Plotting Async Data with matplotlib"
categories: matplotlib python asyncio
created: 2024-02-06
date: 2024-02-07 00:00:00 +0200
published: true
---
## Overview
In my recent project, I aimed to visualize data from a Bluetooth Low Energy (BLE) device, a task that required
integrating different technologies. The `bleak` library was my choice for managing BLE communications in Python, known
for
its robust support for these devices.

The challenge arose when I wanted to plot this data using `matplotlib`, a library that excels in data visualization but
operates synchronously. Since `bleak` operates asynchronously, I faced the task of finding a way to bridge these two
different operational modes.

`matplotlib`, while powerful, necessitates execution on the main thread—a requirement that complicates its use with
asynchronous data streams like those from `bleak`. This scenario highlighted a common issue in software development:
integrating synchronous and asynchronous systems in a seamless manner.

## Solution

To address the challenge of integrating asynchronous data reception with synchronous plotting, I devised a solution that
involves running the `asyncio` event loop in a separate thread, while executing the plotting operations on the main
thread.

Here's an overview of how I implemented this approach:

The key to this setup was utilizing `zmq` to simulate the data communication between the BLE device and the plotting
application. For this, the `aiozmq` library provided the necessary asynchronous support for `zmq` communication.

You can find the complete implementation in my GitHub
repository: [async-plotting](https://github.com/igorbasko01/async-plotting).

Let's briefly discuss the code structure:

First, we establish a new event loop and run it in a background thread, allowing the main thread to handle plotting:

```python
def run_event_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_until_complete(main())


if __name__ == '__main__':
    new_loop = asyncio.new_event_loop()
    t = threading.Thread(target=run_event_loop, args=(new_loop,))
    t.start()
    plotter()
    t.join()
```

Within the new event loop, `zmq` communication handles both publishing and subscribing tasks concurrently:

```python
async def main():
    publisher_task = asyncio.create_task(publish_messages())
    subscriber_task = asyncio.create_task(subscribe_to_messages(update_data))

    await asyncio.gather(publisher_task, subscriber_task)
```

The subscriber receives messages and updates the plotting data through a callback (update_data), which queues the data
for plotting:

```python
plotting_queue = Queue()


def update_data(data: bytes):
    plotting_queue.put(int(data.decode('utf-8')))
```

Finally, the `plotter` function, running on the main thread, continuously reads from the queue and updates the plot:

```python
def plotter():
    plt.ion()
    fig, ax = plt.subplots()
    x_data, y_data = [], []

    while True:
        if not plotting_queue.empty():
            message_int = plotting_queue.get()
            x_data.append(len(x_data))
            y_data.append(int(message_int))
            ax.clear()
            ax.plot(x_data, y_data)
            plt.draw()
            plt.pause(0.1)
        plt.pause(0.1)  # Small pause to prevent busy waiting.
```

This method uses `plt.ion()` for interactive plotting and periodic pauses to ensure the GUI remains responsive and the
plot updates smoothly.

## Conclusion

The technique outlined here is adaptable and can serve as a blueprint for similar asynchronous data visualization tasks.
It highlights Python's flexibility in addressing complex programming scenarios, offering a straightforward path for
those looking to balance asynchronous data streams with real-time plotting.

