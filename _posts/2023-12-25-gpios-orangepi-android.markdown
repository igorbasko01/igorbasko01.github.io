---
    layout: post
    title: "Handling GPIOs Made Easy on OrangePI Android"
    categories: orangepi kotlin gpio
    created: 2023-12-25
    date: 2024-01-10 00:00:00 +0200
    published: true
---
## Preface
Welcome to an exciting chapter in the journey of [Strikeco](http://strikeco.io), where innovation meets the world of tennis simulation. At **Strikeco**, we're not just creating tennis simulators; we're redefining the very essence of interactive sports technology. Our mission is to blend cutting-edge hardware with seamless software integration to bring you the future of tennis experiences.

In this blog post, we'll dive into our latest exploration with the OrangePi 5B SBC. This piece of technology has emerged as a frontrunner in our pursuit of performance excellence and user-friendly design. As we navigate through the intricacies of hardware optimization, each step brings us closer to designing a custom SBC tailored perfectly for our final product.

Join us on this adventure, as we share our insights and breakthroughs with the OrangePi 5B. Whether you're a tech enthusiast, a tennis aficionado, or simply curious about our process, there's something here for everyone. We're excited to give you a behind-the-scenes look at how we're pushing the boundaries of tennis simulation technology at Strikeco.

## Overview
Recently, our team embarked on an innovative project, bridging the gap between hardware and software: we are developing a custom D-pad controller for a Unity-based game, tailored to run seamlessly on a Single Board Computer (SBC). Our hardware of choice for testing? The robust and cost-effective OrangePI.

For the operating system, we chose Android OS, a decision influenced by its seamless compatibility and impressive performance alongside the Unity game engine.

While the specifics of the game itself are intriguing, this blog post will primarily focus on the technical side of things. Specifically, we'll explore how to handle GPIOs on the OrangePI Android OS and how this functionality can be integrated within a Unity game.

Join us at Strikeco as we delve into the intricacies of integrating physical game controls with advanced software. We'll be sharing our insights and practical steps, guiding anyone interested in undertaking a similar endeavor in their Unity projects, especially those involving unconventional gaming setups.

## OrangePi Background
In our search for the ideal SBC for this project, we chose the OrangePi 5B. This decision was based on its impressive performance capabilities — in terms of both CPU and GPU — and its cost-effectiveness.

The OrangePi 5B is equipped with two 4-core CPUs and the ARM Mali-G610 GPU, a combination that offers substantial power for demanding applications. This power is further complemented by an onboard NPU, an exciting feature that opens doors for future projects, potentially involving advanced computing tasks like machine learning.

Another appealing aspect of the OrangePi 5B is its integrated WIFI and Bluetooth functionality. This not only allows for versatile communication options with the device but also paves the way for interesting future explorations in wireless connectivity.

The board typically runs OrangePi OS (Druid), an Android-based operating system. This was a pivotal factor in our decision, as we were planning to develop a game using Unity. The Android platform is renowned for its compatibility with Unity, which we anticipated would ensure a smoother development process and optimal performance for our game.

In summary, the OrangePi 5B emerged as an excellent choice for us — a robust, feature-rich board that's competitively priced. It perfectly suits our current project requirements and offers great potential for future experimentation and development.

## WiringOP
WiringOP is a pre-installed Android application on the OrangePi Android OS, serving as a gateway to exploring the physical pins of the SBC. It provides functionalities to read and write to these pins, offering a visual representation of their states.

One notable feature of the WiringOP app is a button that displays the state of all the pins, essentially mirroring the output of the command-line instruction `gpiox readall`. The resulting display looks something like this:

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

After our team experimented with WiringOP, we realized that if the app could read and write to the pins, we should be able to replicate this functionality in our Android application. But how to achieve this was not immediately obvious.

Our initial search for resources and discussions online didn't yield straightforward answers. Consequently, we took a more direct approach: delving into the source code of WiringOP itself. Discovering that WiringOP came pre-installed with OrangePi OS led us to believe it was bundled with the operating system. This spurred our team to delve into the depths of OrangePI's Android OS source code, aiming to uncover the mechanisms behind WiringOP's functionality.

## OrangePi Android OS
In our endeavor to establish a connection between our Android Kotlin code and the GPIO pins on the OrangePi board, we initially considered exploring the [WiringOP GitHub repository](https://github.com/orangepi-xunlong/wiringOP). This approach, however, proved challenging as the repository lacked clear instructions for compiling the code for Android integration, and we found no further insights in the issues section.

Confronted with limited options, our team decided to delve directly into the OrangePi Android OS source code, available on their official website. The source code is split into several `tar.gz` files, all housed on their Google Drive under the [RK3588S_Android_Source_Code](https://drive.google.com/drive/folders/14efL7SWZ68CZCbUayngLL4iAtGQoV9a0) directory.

To start working with the code, the first step is to combine and extract these files. This involves:

1. Combining the files into a single archive: `cat Android_12.tar.gz* > Android_12.tar.gz`
2. Extracting the contents: `tar -xvf Android_12.tar.gz`

For Windows users, the [Cygwin](https://cygwin.com/) tool can provide the necessary `tar` command. Be prepared, as the extraction process is quite time-consuming and requires patience.

Once the extraction was complete, we began our search for the WiringOP application. As anticipated, it was located in the `packages/apps/WiringOP` directory. Here, not only is the application's source code present, but also, crucially, the C source code of WiringOP, similar to what's seen on GitHub. The key difference here is the presence of several `Android.mk` files – absent in the GitHub repository – which are essential for building the required libraries and files for any Android application looking to access the GPIOs on the board.

In the following section, we will take a closer look at these components to understand what is required for our project and how we can effectively utilize them.

## WiringOP Internals
In the heart of the WiringOP application lies the process of building the necessary libraries – the `.so` files. The most straightforward method we found involves using Android Studio. Open the `packages/apps/WiringOP` directory in Android Studio and navigate to the `com.example.demo.MainActiviy` file. From there, execute the `Build->Make Module 'wiringOp.app.main'` command.

This process generates an `.apk` file, specifically `app-debug.apk`, located in the `build/outputs/apk/debug/` folder. The compiled libraries we need are tucked inside this `.apk`, under the `lib` folder. Within, you'll find two subfolders: `armeabi-v7a` and `arm64-v8a`, each corresponding to a different ARM architecture. For our project, we chose `arm64-v8a`. This involved incorporating the entire folder into our Android project, specifically under the `src/main/jniLibs/` directory.

Having successfully built the WiringOP libraries, the next step is to establish a communication interface with them. In the WiringOP app, under the `com.example.wiringop` package, there's a crucial file named `wpiControl`. It's a class filled with static methods enabling interaction with the WiringOP libraries.

An important note here: when integrating `wpiControl` into your application, it’s essential to retain its original package structure, i.e., `com.example.wiringop`. While not aesthetically pleasing, this is necessary for the JNI (Java Native Interface) to locate the functions in the libraries. While it might be feasible to modify this using tools like `javac -h`, we didn't explore this option for our current project.

Before integrating the wpiControl class into our application, there is an essential step to consider. The WiringPi library maps the memory directly to the pins, necessitating read and write permissions to the physical memory of the OrangePi device. This is achieved by executing `chmod 666 /dev/mem` before calling the `wiringPiSetup()` method. The most practical way to run this command is at your application's startup.

A word of caution: the `chmod 666` command sets permissions that are not secure, especially for a production environment. While this approach was suitable for our initial testing, we recommend caution and encourage further research into more secure alternatives, especially in different or more extensive project contexts.

Now, let's discuss how we integrate and utilize the `wpiControl` class in our Android application.

## Our Project
So far in this post, I've referenced our project several times, and it's time to delve deeper into its specifics. The project is a Unity game controlled by a D-pad, designed to run on the OrangePi5b with Android OS.

The aim was to make the D-pad function like a standard Android D-pad, recognized and handled by Unity without needing custom event monitoring. To achieve this, we utilized the Android `input` CLI command to simulate key presses.

Incorporating this functionality into Unity required creating an Android plugin. This plugin is essentially an Android module containing the compiled libraries and the `wpiControl` class from WiringOP, which interacts with the GPIOs and executes the `input` command.

The plugin works by starting a thread that constantly checks the GPIO pins. When it detects a button press on the D-pad, it triggers the corresponding `input` command to simulate a D-pad key press in Unity.

Here is an example command for simulating a DPAD_UP key press: 

```shell
input keyevent 19
``` 

We based our key simulations on the `KEYCODE_DPAD_*` constants found in the `android.view.KeyEvent` class of the Android SDK. The Android plugin was developed in Android Studio as an Android Library module, where we included the necessary `arm64-v8a` libraries and the `wpiControl` class.

For creating an Android plugin, we just need to create a new project in Android Studio, and create a new module of Android Library type.

Copy the `arm64-v8a` folder under the `src/main/jniLibs/` folder (create the `jniLibs` folder if it doesn't exist).

Copy the `wpiControl` file, under the `src/main/java/` folder into the `com.example.wiringop` package.

The core of the plugin is the `UnityEntrypoint` class, which handles GPIO reading and triggers key events:
```kotlin
class UnityEntrypoint() {
    // The thread that will run our GPIO handling loop.
    private var executor = Executors.newSingleThreadExecutor()

    // This will start the main GPIO loop that handles reading from the pins and invoking the relevant key
    fun start() {
        if (executor.isShutdown)
            executor = Executors.newSingleThreadExecutor()
        executor.execute {
            mainGpioLoop()
        }
    }

    private fun mainGpioLoop() {
        // Prepare the necessary things for using the wiringPi library to read GPIOs.
        runRootCommand("chmod 666 /dev/mem")
        wpiControl.wiringPiSetup()

        // All the D-Pad related pins should be in the IN mode.
        initializeDpadKeysPins()

        // Start looping and handling GPIOs
        while (!Thread.currentThread().isInterrupted) {
            handleKeysPress()
            Thread.sleep(100) // Wait a bit before continuing to read from GPIOs.
        }
    }

    private fun initializeDpadKeysPins() {
        dpadKeyPins.forEach { (_, pin) -> 
            wpiControl.pinMode(pin, 0)
        }
    }

    private fun handleKeysPress() {
        dpadKeyPins.forEach { (key, pin) -> 
            val pinValue = wpiControl.digitalRead(pin)
            if (pinValue == 0) {
                invokeKey(key)
            }
        }
    }

    private fun invokeKey(dpadKey: DpadKey) {
        val keyCode = when (dpadKey) {
            DpadKey.UP -> KeyEvent.KEYCODE_DPAD_UP
            DpadKey.DOWN -> KeyEvent.KEYCODE_DPAD_DOWN
            DpadKey.LEFT -> KeyEvent.KEYCODE_DPAD_LEFT
            DpadKey.RIGHT -> KeyEvent.KEYCODE_DPAD_RIGHT
            DpadKey.ENTER -> KeyEvent.KEYCODE_ENTER
        }
        val cmd = "input keyevent $keyCode"
        // This is a simplified approach, it might be better to also catch exceptions and print the output of the command to catch errors.
        val process = Runtime.getRuntime().exec(cmd)
        process.waitFor()
    }

    // This is basically running a command after switching to the root user.
    private fun runRootCommand(cmd: String) {
        // Please note that it is a simplified example, and we might need to aslo implement output printing and exception handling.
        val process = Runtime.getRuntime().exec("su")
        val dos = DataOutputStream(process.outputStream)
        dos.writeBytes("$cmd\n")
        dos.flush()
        dos.writeBytes("exit\n")
        dos.flush()
        process.waitFor()
        dos.close()
    }

    // Stops the thread
    fun stop() {
        executor.shutdown()
    }

    companion object {
        enum class DpadKey {
            UP,
            DOWN,
            LEFT,
            RIGHT,
            ENTER
        }

        // Here we should adjust the pin numbers, to correspond to the D-Pad buttons.
        val dpadKeyPins = mapOf(
            DpadKey.UP to 4,
            DpadKey.DOWN to 9,
            DpadKey.LEFT to 6,
            DpadKey.RIGHT to 3,
            DpadKey.ENTER to 10
        )
    }
}
```

Building this module in Android Studio generates an `.aar` file, located in the `build/outputs/aar/` folder. This file is then integrated into the Unity project, a process we will describe in the next section.

## Unity
With our Android plugin now ready, the next step is to integrate it into our Unity game. Unity handles Android plugins through the `AndroidJavaObject`, a powerful interface for interacting with Java objects. More information on this can be found in the [Unity documentation](https://docs.unity3d.com/Manual/android-plugins-java-code-from-c-sharp.html).

The key is to create a C# class within Unity that initializes and controls the `UnityEntrypoint` class we developed in the Android plugin. This class will manage the starting and stopping of our GPIO listening loop.

Here’s an example of how this can be implemented in Unity:
```csharp
public class AndroidInputSimulator {
    private AndroidJavaObject _plugin;

    public void Start() {
        // Initialize the Android plugin
        _plugin = new AndroidJavaObject("our.package.UnityEntrypoint");
        // Start the GPIO loop
        _plugin.Call("start");
    }

    public void Stop() {
        // Stop the GPIO loop
        _plugin?.Call("stop");
    }
}

```

This `AndroidInputSimulator` class can be used anywhere in our Unity game to start listening to GPIO inputs. When the `Start` method is called, it initiates the `mainGpioLoop` in a separate thread on the Android device, which listens for GPIO changes and simulates key presses. These simulated key presses are then recognized by Unity’s input system as if they were regular key presses.

To build the game’s `.apk` file for deployment, we need to adjust a few settings in Unity’s player settings under the Android tab. Specifically, in the Configuration section, make the following updates:
```
Scripting Backend = IL2CPP
Target Architectures = ARM64 (only)
```

The `ARM64` architecture setting is crucial because our Android library is built for `arm64-v8a`. The `IL2CPP` scripting backend is required since Unity cannot use `ARM64` with the `mono` backend.

With these settings configured, you can now build and run the `.apk` on your device, and the game should respond to the D-pad inputs as intended.

## Conclusion
In this post, we've journeyed through the intricate process of integrating a custom D-pad controller with a Unity game on an OrangePI SBC running Android OS. Let's briefly recap the key steps we undertook:

1. **Choosing the Hardware**: We started by selecting the OrangePI 5B for its impressive performance and cost-effectiveness, coupled with its compatibility with Android OS – a prime choice for Unity game development.

2. **Exploring WiringOP**: We delved into the WiringOP application, which offered a gateway to interact with the GPIOs on the OrangePI. This involved understanding its functionality and the crucial `wPi` and `V` columns in its GPIO table.

3. **Diving into OrangePI's Android OS**: Faced with limited resources online, we explored the OrangePI Android OS source code to understand and replicate the functionality of WiringOP in our own Android application.

4. **Building the Android Plugin**: We created an Android plugin in Android Studio, incorporating the WiringOP libraries and the `wpiControl` class. This plugin was essential in reading GPIO inputs and simulating key presses using the `input` CLI command.

5. **Integrating with Unity**: In Unity, we used the `AndroidJavaObject` to integrate our Android plugin, allowing us to control the game with the custom D-pad. We also discussed the necessary Unity player settings for building the game's `.apk` file.

As we look to the future, one promising avenue to explore is integrating this custom D-pad setup with Unity's new Input System. This modern, flexible system offers more options for input configuration and might provide an even smoother integration process and enhanced gameplay experience. It's an exciting prospect for further enhancing the interactivity of games on platforms like OrangePI.

Embarking on a project that intertwines hardware and software aspects can be challenging but equally rewarding. Through this journey, we've seen how creativity and perseverance can lead to innovative solutions, broadening the horizons of what's possible in game development and hardware interaction.