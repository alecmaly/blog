---
layout: post
title: DRAFT | Exploring the WinDbg Preview JavaScript API
description: >-
    Trying to recreate the x32dbg/x64dbg stacktrace and dereferencing features in WinDbgPreview by leveraging the JavaScript API. Additionally, playing with Time Travel Debugging (TTD) and inspecting memory on the heap.
tags: WinDbg WinDb-preview JavaScript x32dbg x64dbg poc
toc: true
published: true
---

## Introduction

In my spare time I have been slowly inching my way toward the Offensive Security [OSED Certification](https://www.offensive-security.com/exp301-osed/#course-info). Great open source projects such as [vulnserver](https://github.com/stephenbradshaw/vulnserver) and [phoenix](https://exploit.education/phoenix/) as well as wonderful blogs by [epi](https://epi052.gitlab.io/notes-to-self/), [hombre](https://h0mbre.github.io/), and others has resulted in some rich content to familiarize myself with related material before actually purchasing the course and lab time.

My reverse engineering experience has centered around [x32dbg/x64dbg](https://x64dbg.com) as my main debugger and the NSA's [Ghidra](https://ghidra-sre.org) as a static binary analyzer, disassembler, and decompiler. That said, the OSED requires use of [WinDbg \| WinDbgPreview](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/debugger-download-tools) and  [ida free](https://hex-rays.com/ida-free/), so I have been slowly getting aquatinted with these tools as well.

## Why WinDbg Preview?

Other than the restrictions of the OSED exam, WinDbg offers some advantages over x32dbg/x64dbg. It is more closely integrated with the Windows OS and, perhaps most importantly, it can act as a kernel debugger for debugging the kernel and system drivers. It is most definitely a fantastic tool to learn if you want to learn reverse engineering or low level debugging on Windows.

Beyond that, [WinDbgPreview](https://www.microsoft.com/en-us/p/WinDbg-preview/9pgjgd53tn86) offers some interesting functionality over the classic WinDbg such as: [Time Travel Debugging (TTD)](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/time-travel-debugging-overview), a [JavaScript API](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/javascript-debugger-example-scripts), a modernized UI, and some performance improvements as well. It's not all roses though, I find the lack of multiple memory windows quite limiting and the Time Travel Debugging output can be a bit buggy when looking at x86 executables, so there are definitely some cons to consider.

## The WinDbg Preview Shortcoming

As I have some experience with x32dbg/x64dbg, I quickly noticed a feature that has not been implemented in WinDbgPreview - the ability to see, at a glance, related symbols/dereferenced strings on both the stack and from addresses in registers. 

Here are some screenshots to demonstrate what I am talking about using 32bit Vulnserver.exe as an example debugging target. 

In x32dbg, I have hooked the recv function of the ws2_32.dll module and sent the following commands to:<br>
(1) connect to vulnserver<br>
(2) send some custom user input

[![vulnserver test input - WinDbg](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-18-21-13-47.png)](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-18-21-13-47.png)

You'll notice in x32dbg that:<br>
(1) registers are printing some symbol locations and dereferenced string values. <br>
(2) The same is true for the addresses on the stack.

[![WinDbgGUI](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-18-21-19-02.png)](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-18-21-19-02.png)


Since this is quite handy, I thought it would be a good exercise to port some of this functionality to WinDbg Preview using the JavaScript API.

## Solution

- It's here that I give an honorable mention to [pykd](https://githomelab.ru/pykd), which has been the primary project for automating WinDbg for years. I believe this may be used to accomplish the same task, but I really wanted to play with the JavaScript API as it also is the closest / most documented way to mess with the new TTD objects which may also prove very useful.

The following sections on WinDbg Preview were made following the same steps as the test with x32dbg above. The debugger was attached to vulnserver.exe.

A breakpoint was set on the recv() function of ws2_32.dll using
```
bp ws2_32!recv
```

Then user input was sent to the vulnserver from another console by first connecting, and then sending the custom input:
```shell
ncat localhost 9999    
Help - User input send to vulnserver
```

### WinDbgPreview: Before

This is WinDbg Preview's output. Note that:<br>
(1) the registers do not show any dereferenced information<br>
(2) the stack memory also shows no dereferenced values.
[![WinDbgBefore](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-19-09-31-14.png)](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-19-09-31-14.png)

### WinDbgPreview: After

My POC JavaScript file looks something like this at the time of posting (there is much to be improved): [windbg_script.js](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/windbg_script.js)

After saving the script to the Desktop and loading it in WinDbgPreview with:
```powershell
.scriptload C:\Users\IEUser\Desktop\windbg_script.js
```

<p class="codeblock-label">Note: If the script has already been loaded, you must unload the script first before reloading it.</p>

```powershell
.scriptunload C:\Users\User\Desktop\windbg_script.js; .scriptload C:\Users\User\Desktop\windbg_script.js; !chelp
```

I now have access to a few commands.

`!chelp` shows me my custom help menu:<br>
(1) functions for dumping the current state of the registers/stack, as well as some TTD functions I will discuss later<br>
(2) some utility functions for dumping memory information given a specific address

[![](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-19-09-34-15.png)](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-19-09-34-15.png)

The output of the `!s` 'show state' command is as follows:

**Vertical sections:**<br>
(1a) shows the dereferenced hex value for the given address<br>
(1b) shows the decimal value of the hex<br>
(2) attempts to resolve the symbol of the address location, also showing an offset to a given module (usually a function return address), if possible<br>
(3) shows the dereferenced value as a string

**Horizontal sections:**<br>
(4) registers<br>
(5) stack, as pointed to by the ESP register<br>
(6) possible parameters / local variables based on the ESP register

[![](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-19-09-40-28.png)](/assets/posts/2021-10-18-Exploring-the-WinDbg-Preview-JavaScript-API/2021-10-19-09-40-28.png)

As we can see, some of the info that was available in x32dbg/x32dbg is now easily viewable. The user input "Help - User input send to vulnserver" was found in dereferenced strings and module offsets are clearly visible for each memory location.

While there is much to be improved, I definitely think this is a great step forward in improving the ease of use for WinDbg Preview.


## Time Travel Debugging (TTD) Scripting

Time Travel Debugging lets you capture a debugged process and play it back later, a feature which apparently has existed internally to Microsoft for a while. This is very convenient as the alternative is to take snapshots of a machine and revert it in the event you want to step backward during the debugging process.

It seems like there are more resources slowly trickling out about the JavaScript API and TTD in general. [Microsoft Docs](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/time-travel-debugging-javascript-automation) and blogs like [Diary of a reverse-engineer](https://doar-e.github.io/blog/2017/12/01/debugger-data-model/) have been helpful in my understanding, and there are more resources being posted periodically as well.

In this section I will discuss the other functions in my `!chelp` command that I was experimenting with: `!TTDFindCalls` and `!TTDHeapReads`

In order to run TTD functions, you must run WinDbg Preview as an Administrator and ensure the "Record with Time Travel Debugging" option is selected.

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-00-17.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-00-17.png)

Once execution has been captured, you can open the capture file and explore the lifecycle of the process through WinDbg Preview.

### !TTDFindCalls - show calls of 'module!function'

This command will find calls to particular functions of interest. Running the command `!TTDFindCalls` with no arguments displays a help menu with some possible example commands that may be of interest. The wildcard `*` can also be used when using the module!function format. 

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-04-18.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-04-18.png)

#### Example: !TTDFindCalls "ws2_32!recv"


<p class="codeblock-label">To look specifically at the recv() calls, we can run</p>

```shell
!TTDFindCalls "ws2_32!recv"
```

The output will contain a list of calls.<br>
(1) is the first call to recv() - when we first connected using the command:<br>
`ncat localhost 9999`<br>
(2) is the second call to recv() - with the user input:<br>
`Help - User input send to vulnserver`

The arrows point to links that, when clicked, will execute a command to navigate to the point in time that the function was called in the Time Travel Debugging capture. 

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-17-36.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-17-36.png)

If I click on link (2) in the image above (when the custom user input was entered).

It will then run command (1) in the image below, and set the current time in the debugging session to when that function was called.

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-22-30.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-22-30.png)

From here, I can quickly get the state of the registers and stack from when this function was called by calling my custom function `!s`

The output shows:<br>
(1) EIP register points to ws2_32!recv
(2) Our user input on the stack 

[![dump state output](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-24-00.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-12-24-00.png)

Super fast and easy!

#### !TTDFindCalls "*!*printf"

As another example, say I wanted to see all calls to printf:
```shell
!TTDFindCalls "*!*printf"
```
[![ttdfindcalls printf output](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-01-57.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-01-57.png)

These strings are displayed to the vulnserver.exe windows throughought the lifecycle of the process.

[![vulnserver.exe output](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-16-20.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-16-20.png)

We an see at a glace the first couple parameters to each call of printf; useful for functions that are inherently less visible than printf() or considered "vulnerable functions" if looking for vulnerabilities in a binary.

#### !TTDFindCalls "*!str*cmp"

To view calls to str*cmp:
```shell
!TTDFindCalls "*!str*cmp"
```

Here, we see (3) strncmp() is called with parameters (1) and (2)

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-06-42.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-06-42.png)


This is expected as, if you are familiar with vulnserver.exe, it will compare the user input with several of the possible commands.

Shown in IDA's graph view, each of vulnserver's possible commands are being checked on the user input 'Str1' using strncmp().

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-12-44.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-12-44.png)

This lines up with the commands available in vulnserver. The program checks the start of the user input string against each of the commands available from the HELP menu of vulnserver.exe to determine the code path - basically a set of nested if statements.


[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-54-10.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-54-10.png)

**BUGS**

Unfortunately, I have noticed some inconsistencies with TTD in WinDbg Preview.

For this example, I re-ran the program using this user input (I needed a string that didn't start with 'HELP' to hit the other vulnserver commands).
```
CUSTOM USER INPUT GOES HERE
```

Running `!TTDFindCalls "*!str*cmp"` to dump function calls again yields in more calls to !str*cmp




The user string that is being compared is still visible, however, we cannot see the second string being compared
[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-42-27.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-42-27.png)

I'll mention here that the commands run in the script can also be run from the console, like so.

<p class="codeblock-label">WinDbg 'dx' command to pull the fourth call to str*cmp using the TTD api</p>

```shell
dx -r1 @$cursession.TTD.Calls("*!str*cmp")[3]
dx -r1 @$cursession.TTD.Calls("*!str*cmp")[3].Parameters
```

The console output displays sections:<br>
(1) details regarding the addresses of the function call<br>
(2) parameters for the function call

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-46-06.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-46-06.png)

Navigating to the point in time the function was called by clicking the TimeStart link or running `dx -s @$create("Debugger.Models.TTD.Position", 2201, 148).SeekTo()` and running my custom `!s` command to dump the state of the registers and stack.

We can see the output shows:<br>
(1) 'RTIME ' as the second string being compared against at address (2) `0x181df9cc` on the stack, with a pointer to the string at address `0x0040439b`

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-48-32.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-13-48-32.png)

The astute observer will at this point notice that the addresses listed from the TTD api are different because values are being read as 64bit addresses vs. 32bit addresses... the vulnserver.exe is a 32bit application.

This clumping of values complicates things. I did some magic hand waving in my code to try and split the 64bit values into 32bit values and get a more sensible output. As you can see, the comparisons are much clearer.

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-15-46-46.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-15-46-46.png)

I wanted to point this difference in 64bit and 32bit because the TTD api is still quite new, so it may be a bit buggy. Although, in all fairness, I have no idea what I'm doing, and there may be a way to configure the output to display 32bit values given the program being debugged is 32bit. My expectation would be WinDbg would detect this upfront by either looking at PE header info or by some other means, but this doesn't seem to be the case right now. Thus, my hacky solution works, just know that it is very much a POC and I claim no robustness in its results.




### Playing With Heaps

The last command of my custom functions is
```
!TTDHeapReads - show [ASCII] reads from heap memory
```

My goal was to look for allocated strings in memory and check all instances of heap allocations / memory comparisons to my target string.

As the name may imply, it looks for every time a heap memory location is read and prints if it the value contains some ASCII.

Why is this interesting?

Well, if you are fuzzing an application for vulnerabilities and have sent some user input, chances are that input was put on the heap at some point and will be read later. So say, for instance, you sent the payload "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" and wanted to see where it ends up. Just run `!TTDHeapReads` to view all the read memory and look for your payload!

The output will show the address of the data, the size, some commands you can copy/paste back into the console to view memory using [Debugging Markup Language (DML)](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/customizing-debugger-output-using-dml) or breakpoint so you can break on the read and step through the instructions from there. 

[![](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-15-58-35.png)](/assets/posts/2021-10-18-Exploring-the-WinDBG-Preview-JavaScript-API/2021-10-19-15-58-35.png)

Right now the output is quite overwhelming and the console gets locked. However, some modification to optimize and search for your payload may prove fruitful. 

This is just an interesting ability we have now using Time Travel Debugging and it's been really fun to play with these new functionalities.





# TO DO:
- adding [DML](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/customizing-debugger-output-using-dml)
- BONUS SECTION: Installing WinDbg Preview on offline computer + installing pykd.dll + mona.py...