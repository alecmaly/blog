---
layout: post
title: Adventures in Open Source Contributing&#x3a; Joplin
description: Fixing a bug in open source software leads to diagnosing a systemic unit testing bug.
tags: Electronjs Joplin PowerShell JavaScript
# image: /assets/posts/2021-10-13-Android Hacking Tips and Tricks with Frida & BurpSuite/2021-10-13-13-41-23.png
toc: true
---

# Introduction

[Joplin](https://github.com/laurent22/joplin) is an open source note-taking app. This is a story about my contribution to the project and how fixing a OneDrive sync issue in Joplin lead to me debugging the cause behind failing unit tests (it was date logic + timezones). 

This situation ocurred months ago so I do not have recent screenshots to show, I will be linking to the github issue throughout this post where more detail is provided.

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
- [obsidian.md](https://obsidian.md/) - This solution seems VERY interesting, however, it lacked a mobile app when I originally looked at it. A mobile app has been released in the past few months, so I may have to circle back and reevaluate this product.


# The Problem: OneDrive Throttling Kills Sync Process

What's the best part about open source software? You can fix it yourself! 

Since I have already written about the problem in detail, here is a link to my original [github issue](https://github.com/laurent22/joplin/issues/5244).

## Issue Summary

If you didn't read or understand the github issue linked above, I'll explain it a little bit here.

When syncing a new device using OneDrive as a data source, Joplin would issue so many requests (depending on your # of threads setting) that OneDrive would send back throttling responses that Joplin didn't know how to handle, the app would kill the sync process entirely and you would have to manually start it. Manually restarting the sync would cause another influx of requests to OneDrive, which then throttles again even faster this time due to the previous influx of requests, and kill the sync process again. Ad infinitum. This was annoying for syncing new devices.

## Issue Resolution

The details of this again are in the github issue linked above, but in summary I just implemented some [Microsoft best practices to handle throttling in SharePoint/OneDrive](https://docs.microsoft.com/en-us/sharepoint/dev/general-development/how-to-avoid-getting-throttled-or-blocked-in-sharepoint-online#best-practices-to-handle-throttling) by setting the User-Agent header and leveraging the [retry-after HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) to set a timeout to wait when being throttled. The code changes are quite small and can be found [here](https://github.com/laurent22/joplin/commit/071e1649bc2fd5c3e8a76ce13415e882df332e9c).

# Another Problem: Unit Tests Failing?!

Ok, so I've made the changes and just need to publish them, great. 

Annndddd... my pull request fails validation checks?..
I didn't even make that many changes to the code! 

I pull a fresh instance of Joplin and the tests still fail!!

![joplin build failed](/assets/posts/2021-10-11-Adventures-in-open-source-contributing-Joplin/2021-10-14-12-14-55.png)

At this point, I **ASSUMED** these tests pass for everyone else, so I get to debugging and stepping through the code. 

The explanation is quite involved, you can find my analysis in a github comment [here](https://github.com/laurent22/joplin/pull/5246#issuecomment-888483705) if you are interested.

Ultimately, it came down to timezones. I was in EST, and the test code was pushing mock notes in UTC, then searching for the notes it inserted using Joplin's search feature, however it was searching using my local timezone of EST and not finding the expected data. Thus, failing the tests.

## Timezones: The Developer's Arch Nemesis

After posting [my explanation](https://github.com/laurent22/joplin/pull/5246#issuecomment-888483705), it seems like others had the same issue.

![](/assets/posts/2021-10-11-Adventures-in-open-source-contributing-Joplin/2021-10-14-12-20-07.png)

![](/assets/posts/2021-10-11-Adventures-in-open-source-contributing-Joplin/2021-10-14-12-20-22.png)

Once again proving that timezones are the bane of every developer's existence. For the ininitiated, please check out this very well done (and hilarious) YouTube video by Computerphile titled [The Problem with Time & Timezones](https://www.youtube.com/watch?v=-5wpm-gesOY), it's amazing.

# Conclusion

- Open source software is great and you can fix your own things!
- Communicate! 
    - Talk with other people about your issues, they may have seen them too. I spent hours on debugging the timezone issue, however, if it were known by another developer, them just letting me know it's a known issue would have saved me a lot of time.
- Timezones are the worst.

# ... And Beyond!!

What happens when you want to add functionality to an electron.js app, but that feature would never be accepted into a release because it doesn't suit the majority of users, you ask? 

Just inject the custom code yourself, it's super easy! 
Read about my journey in hacking Joplin in my next post: [Hacking Electron Apps: Joplin]({{ '/2021/10/12/Hacking-Electron-Apps-Joplin.html' | relative_url }}).