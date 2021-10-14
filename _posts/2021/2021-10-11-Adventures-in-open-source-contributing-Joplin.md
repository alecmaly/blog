---
layout: post
title: Adventures in Open Source Contributing&#x3a; Joplin
description: Fixing a bug in open source software leads to diagnosing a systemic unit testing bug.
tags: Electronjs Joplin PowerShell JavaScript
image: /assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-41-23.png
toc: true
---

# Introduction

[Joplin](https://github.com/laurent22/joplin) is an open source note-taking app. This is a story about my contribution to the project and how fixing a OneDrive sync issue in Joplin lead to me debugging the cause behind failing unit tests (it was date logic + timezones).

# Why Joplin?

> Finding the right note-taking app can be difficult, so I'll include a section on my experience here.

After some trial and error with other note-taking apps, I came to the conclusion that Joplin was the right fit for me. In case you are interested, here is the breakdown of where apps fell short for my use case.

## My Requirements

What am I looking for in my note-taking app?
1. Offline capability, I should be able to find content when not connected to the internet.
2. Fast load times between pages
3. Good organization of content; multiple levels of nesting
4. Useful search function to find relevant notes.
5. Content creation in markdown format to (hopefully) make it more portable in the event I want to move to another solution later.
6. Mobile access to notes.
7. Syncing across several devices (Desktop, phone, etc.)
8. Not mandatory, but saving my notes in my own repository like OneDrive would be preferable. I don't like the idea of a 3rd party owning my data.

## Some Competitors

- [Microsoft OneNote](https://www.onenote.com) - Honestly, overall a pretty nice note-taking app. The offline/online syncs work wonderfully and it's overall a nice experience. My major gripe is that you can only do two "levels" of nesting and for my use case I really wanted to nest sort of like folders. For example, one of my notes is located in `Tech - Learning Content > Hacking > Privilege Escalation > Linux Privelege Escalation > lxd group escalation`, I'm not sure how I would achieve the same level of organization in OneNote, however this was probably my second favorite app in terms of functionality.
- [Notion.so](https://www.notion.so/) - I thought Notion was GREAT! Until it wasn't... The user experience was fantastic and their mobile app is the beez kneez. That said, it has some major issues for my use case. For one, the data is all on Notion servers and the offline capabilities are very limited. Perhaps the largest issue I have with the app is load times. I swap pages of notes several times as I pivot techniques when, for instance, testing a web application for vulnerabilities. The load times were significant and made the app completely unusable for me. 
- [evernote](https://evernote.com/) - Too simple for my purposes.
- [obsidian.md](https://obsidian.md/) - This solution looks very interesting, however, it lacked a mobile app when I originally looked at it. 


