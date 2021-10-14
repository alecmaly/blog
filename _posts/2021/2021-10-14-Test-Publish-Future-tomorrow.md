---
layout: post
title: Test Publish Future (tomorrow)
description:
    Learning by modifying an android .apk, intercepting + decrypting network traffic, 
    and poking at game memory (changing function arguments + return values / calling functions by virtual address). 
toc: true
published: true
---

> I originally posted this on [GuidedHacking](https://guidedhacking.com/threads/android-hacking-tips-and-tricks-with-frida-burpsuite.14489/) (excellent website) and figured it would be worthwhile to port it to my new blog! 


# Introduction

Hello,

So, this post has become much more massive than I was expecting it to be. I didn't want to make a full blown tutorial describing every little detail. My goal is to provide a branching off point to give some insight into a few methodologies I have used over the past couple weeks with some recent Android experimentation. I am using pre-built tooling here, so if you are trying to not get caught you should look elsewhere. That said, I believe these tools can be powerfully leveraged in the learning process as GUIs and frameworks sometimes make concepts clearer and easily understood.

I wanted to share a few leanings, tools, tips and tricks that I think others may find useful – especially since a search on the forums for key terms such as Procyon and Frida yielded no results.

The key to this methodology is that I was able to achieve all of this WITHOUT ROOT. I think this is an important note as it's surprising how far you can take this on an unrooted device. Please note that this will not be possible with all games as some validate signatures and do other sanity checks, but it's still worth investigating and fun.

I'm using kali linux where a few of these tools come pre-installed, but instillation on your machine may require a quick google search. A few of these tools will be linux based, I'm not sure if they have Windows versions. Windows does have the linux emulators or the Windows Subsystem for Linux (WSL) which you can enable, but be aware that I have definitely had issues in the past with feature parody to a true linux box, so be aware that if something doesn't work you should just mount a VM and try it there. Not to mention you won't get the GUI based tools like jd-gui with the WSL environment.


**Tools used:**
- [adb (Android Device Bridge)](https://developer.android.com/studio/command-line/adb) – used to pull and push applications to and from your android device. Also can dump android logs. ** note: I was using virtualbox and the USB connection would cut in and out. I'm not sure if it was due to a bad cable, but I would constantly have to unplug and re-plug in the cable. You may experience this as well.
- [apktool](https://ibotpeaches.github.io/Apktool/documentation/) – decode/build .apk
- d2j-dex2jar
- jd-gui/jad/[procyon](https://bitbucket.org/mstrobel/procyon/wiki/Java%20Decompiler) – java decompilers
- frida – a dynamic analysis framework using the v8 JavaScript engine. Allows you to hook game logic and inject with JavaScript.
- javac + java w/ Java Runtime Environment (JRE): command line tools to compile and run Java programs
- [BurpSuite](https://portswigger.net/burp) – network proxy tool
- grep/find/cut/uniq/cat/vim – general linux command line tools to help sift through file content and find files by name/extension
- jarsigner/zipalign/keytool – command line tools to package and resign a new, modified .apk
- Android Studio
- il2cpp Dumper
- EF Explorer/FX Explorer (android app) – file managers

Alright, lets get started. The example app I am going to use is called Hustle Castle: Medieval RPG. Fantasy Kingdom. At this point the game has been out for a couple years. Pretty much everything I poked at was validated server side, which is probably why the developers didn't put any obfuscation on the code base itself. The game loads and runs as a self-signed .apk without any preventative measures, thus we can tamper with it no problemo. It's a nice game to play with as I wouldn't feel comfortable giving out actual working hacks against someone else's source of income.


# 1) Prepwork​

Although we do not need root, there are some features we need to enable on the device. First, you'll have to enable Developer options – consult the oracle (Google) and do that. Next, in Developer options we will need to toggle a couple settings: (enable) "USB Debugging" and (disable) "Verify apps over USB", this will be important when we resign the app and push it to our device, we don't want our modified .apk to be rejected due to a self-signed certificate.


# 2) Getting the APK​

There are a couple ways to do this. One would be to download from a website that provides .apk files such as apkpure.com. If you're like me, you feel weird downloading random stuff from websites, especially when you don't have to. So, an alternative that seems to work, at least for this game, is to download it on the Android device like any other app - from the Google Play Store. Great, now you have the app installed, lets pull the .apk files to our computer. Adb (Android Device Bridge) is a tool used to interact with a connected Android device. This is easily installed on a linux based machine using the built-in package manager (e.g. apt-get install adb). Now, I don't want to drive too deep into a full-blown tutorial, but the jist of this process looks something like this:


Connect your android device to your computer vis USB and run the following commands:

<p class="codeblock-label">List packages on device using adb:</p>

```bash
# 1) list packages on device
adb shell pm list packages

## Note: piping output to grep can help you find the package name in this case,
## 'adb shell pm list packages' | grep hc # helps locate the package name: com.my.hc.rpg.kingdom.simulator

# 2) Get filepath of installed package
adb shell pm path com.my.hc.rpg.kingdom.simulator
```

<br>

Ok, I want to stop here for a moment and take note of something. This application actually has TWO .apks installed. This will be important later. With my limited research, I believe this started occurring when Android introduced project bundling, but I just wanted to point this out as it will affect a few of our later steps.

![](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-12-43-20.png)

Back to it:

<p class="codeblock-label">Pull .apk files from device:</p>

```bash
# 3) Use adb to pull all game .apks from the device. Since there are two in this app, I will download both to my local machine.
adb pull /data/app/com.my.hc.rpg.kingdom.simulator.../base.apk
adb pull /data/app/com.my.hc.rpg.kingdom.simulator.../split_config.arm64_v8a.apk
```


That's it, you should now have your .apk files on your computer.

<hr>
> Note: For all future code examples, I will refer to base.apk as the apk name.
<hr>
<br>

# 3) Unzipping / Unpacking the .apk​

It's important to know that .apk files are basically just .zip files. If you are on a linux based device, you can literally just unzip the .apk itself

```bash
# unzip the .apk files into a folder named 'unzipped'
unzip base.apk -d unzipped
```

^ we will use this later, particularly the .dex files in the output ^

Next we will use a tool called [apktool](https://ibotpeaches.github.io/Apktool/documentation/) to both unzip and decode the files in the .apk. This is useful for several reasons. I won't dive too deep into this as the information is available elsewhere, but as a quick recap: it gives us access to a decoded version of AndroidManifest.xml, [if you've decoded resources] you can access interesting files such as /res/values/strings.xml, it gives you access to smali code (basically android assembly), and it gives us a foothold into our codebase so we can make changes to the smali assembly and re-build it with our changes.

It's important to know that .apk files are basically just .zip files. If you are on a linux based device, you can literally just unzip the .apk itself

```bash
# unzip the .apk files into a folder named 'unzipped'
unzip base.apk -d unzipped
```

^ we will use this later, particularly the .dex files in the output ^

Next we will use a tool called apktool to both unzip and decode the files in the .apk. This is useful for several reasons. I won't dive too deep into this as the information is available elsewhere, but as a quick recap: it gives us access to a decoded version of AndroidManifest.xml, [if you've decoded resources] you can access interesting files such as /res/values/strings.xml, it gives you access to smali code (basically android assembly), and it gives us a foothold into our codebase so we can make changes to the smali assembly and re-build it with our changes.

```bash
# decoding with apktool
# this will create a folder with the name of the package. Change the output folder name with the -o switch

apktool d base.apk
# results in a folder /base/ with the content
```

I again want to stop here and point out something important. In future steps when you try to rebuild your .apk, it may not work and you'll be all like "wtf, this is nutty". Well, there is a very important switch you can use '-r' that will prevent the decoding of resource files. Decoded resources don't re-build well sometimes, so be aware of that. Depending on if you want to inspect those resource files for recon, you can choose to skip this and run another decode later when you are ready to make changes and rebuild the app, or you can just do it now and forget about it.

```bash
apktool d base.apk -r
```

You'll immediately note a difference in the output of apktool.

Without -r

![apktool output without -r](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-32-38.png)

With -r

![apktool output with -r](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-33-04.png)

# 4) Decompilation and Static Analysis​

Ok, this is where it starts getting a bit interesting. Let's go into the 'unzipped' folder to inspect files we extracted in section 3, above. You'll notice a few .dex files.

![](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-33-48.png)

You'll notice that there is a classes.dex and a classes2.dex. Similar to how the .apk was split into two .apk packages, as Android apps got larger they started to split java classes resources into multiple .dex packages. I'm not sure why, the rhyme or reason, but just be aware to check out both as interesting code can be found in each.


To prepare for the decompilation, we need to convert each .dex into a .jar. To do this, there is another handy command line tool called dex2jar. I will run it on both my classes.dex files.

```bash
# convert .dex to .jar

d2j-dex2jar classes.dex
# outputs to the file: classes-dex2jar.jar

d2j-dex2jar classes2.dex
# outputs to the file: classes2-dex2jar.jar
```

I will now split the next section into different decompilation tools. You'll notice next to each tool I reference a Java version number. Decompilation gets mildly annoying because a few of the tools are older and support different versions, while newer tools may support newer versions but are not necessarily feature complete or have other bugs/complications. Some output is cleaner than others. You'll probably end up spending time bouncing between them for some .java files (especially ones involving decryption) to cross reference output. There are actually several decompilers out there, a bit of research will go a long way and I encourage you to explore options I have not listed here.

jad (java 6?):

It was a pretty popular command line tool/decompiler. No longer supported but still can be useful when jd-gui output is a cluster. Used to decompile .smali (android assembly) into readable Java code – outputs to a .jad file extension. Simply run it on a .smali file (generated in the apktool output directory in step 3) and 'cat' the resulting .jad file.


```bash
# If you want an idea of where smali files can be found you can run find to get a list of all smali files in subfolders from the current directory:
# find . -name '*.smali'

jad target_file.smali
cat target_file.jad
```

Note that the previous tool (jad) was run directly on .smali files generated from apktool. The following two tools can be run on the .jar files that were unzipped into the /unzipped/ directory in step 3.


- jd-gui (supports up to java 7):

Pretty much the simplest to get started with, it's very fast and effective. Just run 'jd-gui' at the command line, point it at your .jar file, and start browsing the decompiled .java files. While the tool is closed source and no longer maintained, it is so fast and easy that it's worth knowing.

Here is what the tool looks like. My text may be small or look wonky because apps don't typically scale well 4k 13" laptop monitors:

![jd-gui output](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-38-09.png)

- [Procyon](https://bitbucket.org/mstrobel/procyon/wiki/Java%20Decompiler) (java 8):
This is a nice .jar to decompile into java 8, which introduced several features such as lambda functions, the :: operator, etc. What worked really well for me is to decompile the entire .jar (both of them in this case) to an output directory and open that directory in an editor such as VS Code to inspect the .java files – this results in an experience similar to jd-gui with just the added overhead of downloading procyon and running a few commands for setup.

Downloading Procyon results in a .jar file which I will call decompiler.jar. You may have to build it from source, I don't remember. It's easy, just follow the docs.

I'm too lazy to test specific commands again, but they should look something like this based on the documentation.

```bash
# use the Procyon decompiler.jar to decompile classes-dex2jar.jar to the procyon_out directory
java -jar decompiler.jar -jar classes-dex2jar.jar -o procyon_out
```

Ok, now that you have access to Java code, feel free to analyze it and understand how the game works. Keep in mind this is only the written code, and not code found in any game engines such as unity3d. This decompiled code will only take you so far in some cases. You can use tools such as grep and find to search through the code quickly and find target files.

For instance, running on my procryon output directory:

<p class="codeblock-label">Useful command line tools:</p>

```bash
# returns all lines in all files (recursively) with the target text, case-insensative
grep -RIi "decode("

# grep accepts regex but can be escaped with \. Regex is useful for many things such as finding imports
# finding any .java file that uses json packages
grep -RIi "import.*json"

# Use the -v in subsequent greps to do a reverse grep and omit the lines that match that criteria. If you wanted to omit files in the /ironsource/ directory because you don't care about those package files right now
grep -RIi "decode(" | grep -vi "/ironsource/"

# Get unique filenames with a few other commands by splitting on the semicolon and piping the output to uniq
grep -RIi "decode(" | cut -d';' -f1| uniq

# Find's all files with .smali extension
find . -name "*.smali"

# finding an interesting file, you can cat it to the console
cat interesting_file.java
# OR you can open it in an editor such as vim
vim interesting_file.java


# Vim can be very useful because you can use commands such as
:/searchtext/g


# to search for content. Press 'ENTER' then keep pressing 'n' to find the next match. 
# This can be an easy way to open a file and jump to the interesting section much like ctrl+F 
# would do in a GUI based application. 
# There's a pretty awesome game to learn the basics of VIM that I have found fun and useful. 
# >> https://vim-adventures.com <<
# Issa good one.
```

Ok. I just wanted to give another way to search through the files, please look up the documentation on these commands if you need to, they are very useful to easily and quickly to find interesting files and lines of code. I don't want to dive deep into the specifics, only give guidance on a few options.

It's important to note that this code may only go so far. This game, for instance, is running unity3d, meaning it includes some unity .so binary files (a .so is basically a linux .dll), with the raw, compiled game logic. Thus, there isn't much you can do with this code output. I will go more into analyzing and hooking the .so binaries in the Dynamic Analysis section of this post, but I also want to touch on a bit more here.

While I hesitate to dive too deep, I want to give some more detail on using this code we decompiled in a practical way.


# 5) Using the static analysis data and decoding some intercepted network traffic​

Here is a practical example of using this data gathered from static analysis. It's a bit game specific but can be abstracted to other situations you may encounter. I will try to avoid going too deep into a tutorial because again, you can just google the specifics and this post would be even longer if I got into that.

For this section, I am going to use a tool called Burp Suite (installed on my computer) to intercept WiFi traffic from my phone. Note that this method may fail due to various reasons, one of which is if the app does certificate pinning which you will have to bypass by modifying the .apk or by other means – do some google fu if you need to for your use case.

Setup:

I don't want to get too deep here, but I will briefly explain the general process. Feel free to google Android + Burp Suite and you'll figure it out. These steps are [documented elsewhere](https://support.portswigger.net/customer/portal/articles/1841102-installing-burp-s-ca-certificate-in-an-android-device), but I wanted to provide a few steps outlining the process to provide clarity if you get stuck.

Note that you will need to re-download the Burp Suite certificate as you change networks or restart Burp Suite. Just be aware if things aren't working, you may want to try re-downloading the certificate and install it.

1. First, download Burp Suite (obviously).


2. Second, You'll want to disable the Interceptor for now so setting up the proxy doesn't stop traffic. From the (a) proxy tab, (b) disable the 'Intercept' button

    ![burp1](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-40-07.png)

    Create a new proxy listener. This can be done by (a) going to the proxy tab, (b) options, (c) add, (d) bind to an unused port and select 'All Interfaces', then click Ok.

    ![burp2](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-40-41.png)

3. Third, get the ip address of your computer running Burp Suite (e.g. using 'ip addr/ifconfig' on Linux or 'ipconfig' on windows terminal looking for inet/IPv4 parameters, respectively).

4. Fourth, you're gonna want to open that port on your router because it's probably not going to be open by default. Look up your router information on how to do this from the Admin web interface of your router. I suppose you may need to open ports on your device firewall such as with the command 'ufw' on ubuntu or through the windows defender firewall on windows. Make sure your inbound/outbound rules are configured appropriately on each device. (you only need to do this once per router/device)

5. Fifth, configure the target WiFi network settings on the android device to 'Manual' proxy mode and set the ip address of your host machine and port you specified using Burp Suite – it's in the advanced settings of your current network settings (settings for the current target SSID)… I hope that makes sense because there is another network settings page we will use shortly to install a certificate. Google will help you configure a proxy on your android device if needed. I've provided a screenshot below of the proper settings button to provide clarity.

    ![android wifi settings](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-41-23.png)

6. Sixth, from the android device, go to [http://burp](http://burp) and download the CA Certificate on the top right.

    ![download burp certificate](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-42-13.png)

7. Seventh, open an android app such as 'EX File Manager' or 'FX File Manager' because we are going to have to rename the certificate that was just downloaded. It is downloaded as a .der, but you need to rename it as a .crt or a .cer for Android to recognize it.

8. Eighth, from the Android device, you should now go into the Advanced WiFi settings (not the settings of the current SSID) and 'Install network certificates', select the downloaded certificate and name it whatever you want.

    ![android settings 2](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-42-43.png)

    Great, you can now test going to a page like test.com on the Android device and check the HTTP History tab in Burp Suite to ensure you are capturing traffic.

    Check the `Proxy > HTTP History` tabs. In this example I went to blah.com on my android device. Note that some sites that require HTTPS may not work because Chrome, Firefox, and potentially other browsers validate certificates with built in good/bad certificate lists due to past exploitation. You'll get a warning message to proceed and at best it's just extra clicks. Here, blah.com was a quick way to test.

    ![test interception](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-43-35.png)

Now that we have a proxy on our network traffic, you can play the game and notice a few calls being made to different servers. One is much more strongly obfuscated than the other. For this instance, we are going to look at the network traffic with base64 encoded payloads.


Using methods described earlier, I found an interesting file
You'll notice a file called MRGS Define which contains a few keys in the form of byte[] and a function to convert them to a String. Encript is spelt with an 'i' here.. tricky tricky.

![code](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-44-06.png)

Using previous techniques, we can now grep through the code base to quickly find interesting files with this function call.

![](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-44-25.png)

Where we land into another file with a decode function.
It gets a bit deeper, only in the sense that there are some decode functions to call other decode functions. I'm not going to post another bunch of screenshots, but I would like to illustrate a few more points.

Mainly that we can take these decode functions and pull them out into our own java project. Creating out own program.java with a typical java structure

```java
public static void main(String args[]) {
    … EXTRACTED DECODE FUNCTIONS AND KEYS …
}
```

With the Java Runtime Environment installed, you can compile and run this code from the command line:

```bash
## Important note: my file is called program.java

# compile the program
javac program.java

# run the program
java program
```

We can now run some code locally and try to understand what is going on. Take note that this code comes from not only a decompiled source, but it is also an Android device with access to Android SDKs. One key and common example is the base64 library. Android seems to use android.util.Base64 which has different syntax from the typical java.util.Base64 package.

To get around this, you can either try to convert your code or maybe even download Android Studio, install a virtual android image, create from the template with one button, and hook that button to a function where you run your code and Log.d code to the debug console. I won't get into that process, but that's what worked for me for trying to run the Android SDK code when things started getting a bit more complex and I was attempting to understand how it all worked. For instance, there are more encrypted payloads being sent to severs and I spent some time trying to serialize that crazy Unicode into Android Java objects such as Parcelable objects.


The end result of all this is we can intercept traffic from this source and decode the base64 given the proper encryption key.


- An example:

Base64 from a server response, captured in Burp Suite:
```text
OOSiN+qRISyRbVuBavlaWIz5R1/NmHVYskxkRgql+D4eMEhpBRmN5bhrACFnUrpuyR/9uXjFv+QvfT5yIUd5uhhwdKP3I8iiQ/4MdpDOoSI=
```

![burp captured traffic](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-48-28.png)

You'll notice standard base64 decoding results in gibberish:

![base64 decoded data](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-48-54.png)

But our local java program with the proper keys and decryption algorithm:
![](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-49-20.png)


Hurray for symmetric keys!!



In this game, this doesn't do much for us, but perhaps it will be more useful in another game. The rest of the traffic is not decoded with this algorithm, it looks more like this and is encoded somewhere in the game logic, deeper than the .smali code. It looks something like this (screenshot below), and after much effort trying to deserialize or find some other encryption method (even going down to a Huffman encoding schema I found in the okio library because all responses started with a 1 in their binary representation), it is clear this encoding was probably done in the .so binary layer.

![](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-49-41.png)


# 6) Dynamic Analysis with… wait… let's talk about logs.​

Before I get into a brief overview of Frida, I'd like to point out something that is useful for both the Dynamic Analysis section and the Static Analysis mentioned above. While programming, many developers leave interesting console output statements in code that are not always removed when the application is pushed to production. While running the game, you can attach your Android through USB and use 'adb' to inspect device logs.


<p class="codeblock-label">Dumping logs with adb:</p>

```bash
adb logcat
```

This will dump the logs on the device and eventually you will see more of a scrolling action as logs come in. You can dump this to a file to `cat log_output |grep _searchTerm_` or you can `adb logcat |grep _searchTerm_` to filter in real time. This can be useful because you may see functions that relate to network traffic or see logs of the game that could provide greppable code in the codebase if the strings are not encrypted. This technique may aid in pinpointing .java files of interest.

Another interesting note is that the game may be saving some logs from the game. Not all of these files are available in the /data/ directory on an unrooted device. That said, I noticed while using EX Explorer that there is another path that is accessible and may contain valuable app log data. This path is /storage/emulated/0/Android/data/com.my.hc.rpg.kingdom.simulator. Clearly your package name may be different, but in this case the directory has a /files/logs folder with app generated logs that are pretty interesting to cross reference with app code.

I figure I would mention these two log sources as they can be additional data sets that could prove invaluable depending on your application.


In summary, the two locations I found logs for this game are those dumped by `adb logcat` while the game is running and /storage/emulated/0/Android/data/com.my.hc.rpg.kingdom.simulator. Adb can be used to pull those files to your machine for local analysis, if needed: `adb pull /storage/emulated/0/Android/data/com.my.hc.rpg.kingdom.simulator`


A quick example of log usage:

This game has network traffic with encoded payloads, but oddly enough, there are a few variables in plain text.

![](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-51-21.png)

I can run `adb logcat > log` to pipe log data into a log file which I can grep through. Running `cat log | grep d_7V` I get the following output

![](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-52-02.png)

I now know this is a firebase token and that MRSGPushNotificationHandler.java may be interesting to look at. Even if that .java file contains nothing, the fact this is a firebase token arms me with more data. I can grep through the .java or other useful files looking for calls to functions like getFirebaseToken() or looking for what may be building a POST request with a firebase token in the payload. I hope I've illustrated the point and utility of logs when you are stuck, they could be that golden ticket that keeps you going. You can then also hook these functions using Frida (below) and possibly find the code that is being used to send/receive data to/from the server.


This leads me to the next phase of this progression, dynamic analysis.


# 7) Injecting Frida and building our modified .apk​

Let's talk about Frida. It's a dynamic analysis framework that works by injecting a binary into the application. In this case since the phone is not rooted, we will be modifying the application code to call the Frida binary upon startup, which then spins up a server listening on a port that you can connect to and run JavaScript code to interact with your app – effectively hooking into the running application. Much like any other game, I would imagine using open source tooling is a quick way to get caught, but it can also be useful to very quickly iterate on a game, poke at some game logic, and learn exactly where to write your custom cheats, mods, or whatever you crazy kids do these days.


Again, there are plenty of tutorials on this but I want to briefly explain the process at a high level and note a few examples that may be useful.

I'd like to point out there are tools such as [objection](https://github.com/sensepost/objection) to automatically patch your apk with frida-gadget. It did not work in my case, I believe because of the multiple .apk files. There may be a way to pass in an argument, but I wanted to do it a bit more manual for learning purposes anyway. This may be a tool worth checking out if you are interested.
The process:

First we need to download and extract the frida-gadet binary. You can download from here: [frida/frida](https://github.com/frida/frida/releases).

In my case, my device is arm64-v8a (you can validate using adb: `adb shell getprop ro.product.cpu.abi`), so I will download the arm64 version of frida gadget

<p class="codeblock-label">Download frida-gadget:</p>

```bash
# download the gadet

wget frida-gadget-12.8.9-android-arm64.so.xz
# extract

unxz frida-gadget-12.8.9-android-arm64.so.xz
# results in: frida-gadget-12.8.9-android-arm64.so
```

You will now need to move this binary into the proper directory of the decompiled apk. But which one? I'd like to point out that the game I am using as an example had 2 .apk files. One was base.apk and the other was split_config.apk. At this point, I need to run 'apktool d split_config.apk' on the second apk file to decode it into the /split_config/ directory.

You will place this frida-gadget.so where the other binaries are being loaded in the app. A useful tool is find if you'd like to quickly find the target directory: 'find . -name '*.so'

Even if all the .so binaries were loaded from the base.apk, this step would still be required as we need to re-push the app with all .apk files in the bundle; all .apks will need to have the same certificate chain to successfully install. So, for instance, if we only modified the base.apk and tried to combine it with the original split_config.apk, our device would detect that the signature chains do not line up and reject the install.

Moving on. Now we can move the frida-gadget-12.8.9-android-arm64.so into the libraries for import, and rename it to 'libfrida-gadget.so' – as all android binaries need to start with 'lib' and end with '.so'

<p class="codeblock-label">rename and move frida-gadget to the proper directory:</p>

```bash
mv frida-gadget-12.8.9-android-arm64.so /split_config/lib/arm64-v8a/libfrida-gadget.so
```

**Config file:**
This part is not required, I believe, as defaults are embedded into the program. That said, the defaults can be confusing if you do not know they exist. When starting the modified game, you may end up with a black screen and think something is broken. Actually, the default is set so that the game pauses for you to attach to the frida-gadget server before it proceeds. This is so you can hook before any other code is loaded, allowing you to nop anti-cheat code, attach a debugger, or do whatever you need to do. To change this behavior, you can create a 'libfrida-gadget.config.so' file, written in JSON (don't be confused with the .so extension, it works). Mine looked like this (below). the important part is the "on_load" where I declare that the app may resume like normal immediately upon loading the frida-gadget binary.

This is created in the same directory as the libfrida-gadget.so binary.

<p class="codeblock-label">libfrida-gadget.config.so:</p>

```json
{
    "interaction": {
        "type": "listen",
        "address": "127.0.0.1",
        "port": 27042,
        "on_load": "resume"
    }
}
```

We then inject some smali code to load libfrida-gadget.so when the game loads.

I won't get too deep about how I chose this for this specific game as methodology is described in other online resources, but here I chose the static constructor in /hustlecastle/AndroidCoreActivity.smali to inject the required smali code to call the frida-gadget binary. I didn't see it in every doc, so I will point out that you should increment the '.locals ' at the beginning of the function call by 1, and inject your smali code, as we will need to set a string variable. Also, if there are other variables in use, you may want to consider using v1, v2, or otherwise to prevent polluting registers and crashing the game.

This code just sets a string variable to the name of the frida-gadget.so and loads the library.

![](/assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-56-02.png)

At this point we are ready to rebuild the .apk and push it to our device. This step must be repeated for all .apk files. I will post some code as a reference, but I encourage you to google for a better understanding of what is happening. Some of functions you may need to do multiple times if you are repeatedly messing with smali code and seeing how it affects the game, it may be useful to make a few shell scripts such as build.sh and sign.sh to aid in this process. Note that there are other tools that may do this automatically for you.

<p class="codeblock-label">Building a new self-signed .apk from our modified package:</p>

```bash
# generate a key to sign the app. This only needs to be done once and the .keystore file will be created in the local directory.
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

# build the /base/ directory files back into an .apk
apktool b base -o new_base.apk

# sign the new .apk
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore new_base.apk alias_name

# zipalign the .apk – this is to optimize the .apk which android requires for instillation
zipalign -v 4 new_base.apk signed_base.apk
# The output file is called signed_base.apk – this is the modified, signed .apk you will be pushing to the device with adb
```

Push modified .apk to the device.

Remember to uninstall the current version of the app from the phone. You can now use adb to install the modified .apk. Note that this step requires the developer settings mentioned above to be enabled/disabled respectively.

<p class="codeblock-label">Install bundled apk files:</p>

```bash
adb install-multiple signed_base.apk signed_split_config.apk
```

If the app did not have multiple .apk files, you could simply use 'adb install signed_base.apk' and be good to go.


# 8) Dynamic Analysis with Frida​

Alright, so we have Frida injected into the game, it's time to load the game and connect.

First, ensure you can connect to your device using `adb shell` – this will start the adb daemon, which is required, if it isn't started already. Feel free to `exit` out of that shell once you've confirmed you can connect.

To test if Frida is connecting you can run

<p class="codeblock-label">Attach to frida-gadget:</p>

```bash
# attach frida over USB to the gadget
frida -U gadget
```

You should now have a shell like with access to frida commands.

You can also create .js files with Frida code and run pre-defined commands directly into the hooked game.

<p class="codeblock-label">Run frida_payload.js using frida-gadget:</p>

```bash
# attach frida over USB to the gadget
frida -U -l frida_paylod.js gadget
```

For instance, a .js file to dump classes (e.g. pipe this to a file and grep through it):

<p class="codeblock-label">enumerate_classes.js:</p>

```javascript
Java.perform(function() {
    Java.enumerateLoadedClasses({
        onMatch: function(className) {
            console.log(className);
        },
        onComplete: function() {}
    });
});
```

You can hook the methods in those java classes and change their implementation to do additional things, change parameters or return variables. For instance, hooking the toString() function of the org.json.JSONObject class – this prints that the function was called and the returned string's value to the console. You'll notice that the return_value = this.toString(); here, we are calling the original toString() method and getting the return value.


<p class="codeblock-label">Hook org.json.JSONObject Java class:</p>

```javascript
Java.perform(function x() {
    var activity = Java.use("org.json.JSONObject")
  
    activity.toString.overload(').implementation = function() {
        console.log("called toString of JSONObject")
        var return_value = this.toString()
        console.log(return_value)
    }
}
```

We can also Intercept game logic. This game was built with unity and has lib2cpp.so, which has the bulk of the game logic. Much like ([Tutorial - Android Mod Menu Tutorial (Very?) Hard (Works on il2cpp and native games too](https://guidedhacking.com/threads/android-mod-menu-tutorial-very-hard-works-on-il2cpp-and-native-games-too.13795/#post-82451)), you can dump the offsets of lib2cpp.so by using il2cppDumper. With those offsets, you can use the Interceptor tool in Frida to hook functions in the binary itself. This is useful because many of the java classes are just high level code that makes api calls to the lower level .so functions, comprising the bulk of the game engine.

We can hook the function calls given the offsets
An example: hook_function_by_offset.js

<p class="codeblock-label">Hook .so binary function using Frida Interceptor:</p>

```javascript
// function: canClaimReward
Interceptor.attach(Module.findBaseAddress('libil2cpp.so').add('0x1ABE890'), {
    onEnter: function(args) {
        console.log("function was called")

        console.log("arg0: " + args[0]) // some pointer, not sure to what
        console.log("arg1: " + args[1]) // usually first parameter to function

        // uncomment below to change first parameter value as the function is called, the ptr function is necessary, please look at the Frida docs if needed
        // args[1] = ptr('0x1')
    },
        onLeave: function(ret_val) {
            // change return value of this Boolean function to always be true

            ret_val.replace(0x1)
            return ret_val
    }
}
```

Or even call functions outright based on their offsets:

<p class="codeblock-label">Run function based on offset:</p>

```javascript
var func_ptr = Module.findBaseAddress('libil2cpp.so').add('0x1ABE890')
// NativeFunction(func_ptr, return datatype, argument datatypes)
var f = new NativeFunction(func_ptr, 'void', ['int'])
f(0x1)
```

I don't want to get too deep here because there is a lot of documentation, but those are some examples of hooking java classes, altering function arguments and return values, and hooking/calling functions directly out of an .so binary. I encourage you to look at the Frida api documentation and examples people have posted online for further guidance.

Well, this is pretty much a summary of a couple weeks of research and experimentation. Hopefully someone finds it useful. This was all done on an unrooted device. Mileage may vary.