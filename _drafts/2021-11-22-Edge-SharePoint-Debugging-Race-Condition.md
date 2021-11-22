---
layout: post
title: DRAFT | Debugging a Race Condition Between Microsoft Edge and SharePoint
description: >-
    A random redirect when opening Edge leads to an investigation discovering some interesting behavior between Edge and SharePoint.
tags: SharePoint Microsoft-Edge Chromium Electron.js Race-Condition Debugging
toc: true
published: true
---

# Introduction

I recently debugged an issue at work that I thought was worthy of a blog post. It yields some insight into how Edge and SharePoint operate, as well as a useful trick to track network traffic for chromium based browsers as well as electron.js apps.

Since it's work related I have opted to not include any screenshots or sensitive information, hopefully you can follow my word soup without a visual aid...

# Problem Info

A user was using the default Edge browser and had their homepage set to a SharePoint site. Upon launching Microsoft Edge, the user would be taken to their O365 login screen, and after login they would be redirectetd to a random SharePoint site - more accurately, the user would be redirected to the logo of a random SharePoint site. Clearing cache sometimes fixes the issue - sometimes it doesn't.


# Problem Analysis

## Capturing Network Traffic

The first thing I did was open up the Network tab in a browser and save the network traffic. However, this didn't capture the initial network traffic that the browser initiates on launch. In essense, we would launch Edge, a bunch of redirects would route from sharepoint > ms online login, at which point I was finally able to open the developer console and capture traffic. This was too late. I needed to see all network traffic upon Edge startup.

I tried my usual tools to capture network traffic. Issues would arise as the user was not an administrator on their machine and could not install a certificate to decrypt traffic, or the proxy would ruin the authentication as we have [Windows Integrated Authentication (WIA)](https://docs.microsoft.com/en-us/aspnet/web-api/overview/security/integrated-windows-authentication) enabled in our environment.

In the end, I found a nifty post showing I can start Edge with some parameters to dump network traffic to a log file:
```text
msedge.exe --log-net-log=%USERPROFILE%\Desktop\ReproNetlog.json --net-log-capture-mode=Everything
```

This should work with electron.js apps and chromium based browsers! Super handy!

From here, we logged in and reproduced the issue. A ReproNetlog.json file would be created with the network traffic since msedge.exe was launched. Reading the output can be done in Fiddler using the [FiddlerImportNetlog extension](https://github.com/ericlaw1979/FiddlerImportNetlog).

## Traffic Analysis

Upon analyzing the traffic, I see a few more redirects than expected.

It goes something like this:
1. Launch Edge
2. Go to sharepoint.com
3. sharepoint.com it redirects to shareoint.com/_forms/default.aspx
4. default.aspx redirects you to login.microsoft.com and sets a cookie (RpsContextCookie) of the SharePoint site you were trying to go to 
5. login to login.microsoft.com
6. redirects you back to default.aspx
7. POST request to default.aspx redirects you to where you were TRYING to go (step 2) based on the cookie that was set at step 4 (cookie: RpsContextCookie)

Step 5 is manual, however, before step 5 all the redirects are done immediately upon Edge startup. 

The interesting thing is that there was quite a bit of network traffic peppered in between steps 1-5. Some of which were querying other SharePoint sites and pulling their logos. 

I also noticed a few calls to domains I didn't recognize.

## ntp: New Tab Page

One of the interesting locations was an address:
```
https://ntp.msn.com/edge/ntp
```

When researching, I came across this interesting post [xss New Tab Page](https://leucosite.com/Edge-Chromium-EoP-RCE/) which shows a previous vulnerability in the service; more importantly, it provides some insight into what it is and what it's doing.

Ultimately, when you open a new tab in Edge you'll be presented with a dynamic page with content that is relavent to you:

![edge new tab page](/assets/posts/2021-11-22-Edge-SharePoint-Debugging-Race-Condition/2021-11-22-14-46-16.png)

The important note is that this content is dynamic and pulls from Microsoft's servers. There are quick links at the top and if logged into Edge with your work profile, more sections will show up such as recent/frequent SharePoint sites. 

The last critical piece of the puzzle is that Edge has a setting to pre-load the new tab page for performance reasons, and this is enabled by default.

![edge settings: preload new tab page](/assets/posts/2021-11-22-Edge-SharePoint-Debugging-Race-Condition/2021-11-22-14-50-46.png)

## Root Cause

So, I now know that there are a series of redirects when logging in, and that a cookie is used after logging into login.microsoft.com to redirect you to the SharePoint site you originally requested.

I also know that Edge's new tab page by default pulls from Microsoft servers so it is unaffected by cookies/cache, and this page is pre-loaded on startup.

I can now deduce that the phases in the login flow looks something like this:
1. User opens Edge, a series of redirects takes place to get them to login.microsoft.com. The `RpsContextCookie` is set. (user starts entering credentials)
2. In parallel to the user entering credentials, Edge is pre-loading the new tab page, which is querying the recent/frequent SharePoint urls for their logos to display in the new tab page. These queries to SharePoint CORRUPT THE `RpsContextCookie` cookie.
3. (The user finishes entering credentials and logs in) login.microsoft.com redirects back to sharepoint.com/...../Default.aspx where the corrupted `RpsContextCookie` is used to redirect the user to the logo of the SharePoint site that was fetched in phase 2. 

The result is the user being redirected randomly on login. Clearing cache may or may not fix the issue temporarily.


## Resolution
For the user, we just disabled pre-load in the Edge settings and it seemed to work. 

This can be applied globally as a GPO to the enterprise if it is a more widespread issue (e.x. if your default enterprise homepage is a SharePoint site).


# Conclusion

This was an interesting race condition to debug and I learned quite a bit about the behavior of Edge/SharePoint, as well as a nice trick to capture network traffic of any chromium/electron.js based application. I hope you found something useful from this article as wel.