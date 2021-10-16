---
layout: post
title: DRAFT | Exploring the WinDBG Preview JavaScript API
description: >-
    Trying to recreate the x64dbg stacktrace feature in WinDBG Preview. 
tags: windbg windbg-preview JavaScript x64dbg
toc: true
published: true
---

# Introduction

In my spare time I have been slowly inching my way toward the Offensive Security [OSED Certification](https://www.offensive-security.com/exp301-osed/#course-info). Great open source projects such has [vulnserver](https://github.com/stephenbradshaw/vulnserver) and [phoenix](https://exploit.education/phoenix/) as well as wonderful blogs by [epi](https://epi052.gitlab.io/notes-to-self/), [hombre](https://h0mbre.github.io/), and other has resulted in some rich content to familiarize myself with related material before actually purchasing the course and lab time.

My reverse engineering experience has centered around [x64dbg](https://x64dbg.com) as my main debugger and the NSA's [Ghidra](https://ghidra-sre.org) as a static binary analyzer, disassembler, and decompiler. That said, the OSED requires use of [WinDBG \| WinDBG Preview](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/debugger-download-tools) and  [ida free](https://hex-rays.com/ida-free/).

Now, [WinDBG Preview](https://www.microsoft.com/en-us/p/windbg-preview/9pgjgd53tn86) offers some interesting advantages over the classic WinDBG, such as [Time Travel Debugging (TTD)](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/time-travel-debugging-overview), a [JavaScript API](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/javascript-debugger-example-scripts), a much improved UI, and I believe some performance improvements as well.

# The Problem

As I have some experience with x64dbg, I quickly noticed a feature that has not been implemented in WinDBG Preview - the ability to see, at a glance, the stack and related symbols/dereferenced strings. Since this is quite handy, I thought it would be a good exercise to port some of this functionality to WinDBG preview using the JavaScript API.

- [pykd](https://githomelab.ru/pykd): It's here that I give an honorable mention to pykd, which has been the primary project for automating WinDBG for years. I believe this may be used to accomplish the same task, but I really wanted to play with the JavaScript API as it also is the closest / most documented way to mess with the new TTD objects which may also prove very useful.

For reference, this is what x64dbg looks like:

\>> TODO: IMAGE OF x64DBG FEATURE \<<

# Solution



\>> TODO: SIDE BY SIDE PICS \<<

# Time Travel Debugging (TTD) Scripting

While we are messing with JavaScript, what can we do?

## Playing With Heaps

My goal was to look for allocated strings in memory and check all instances of heap allocations / memory comparisons to my target string.

\>> TODO: IMAGES + EXAMPLES \<<
