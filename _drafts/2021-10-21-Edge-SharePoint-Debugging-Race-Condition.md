---
layout: post
title: DRAFT | Debugging a Race Condition Between Microsoft Edge and SharePoint
description: >-
    A random redirect when opening Edge leads to an investigation discovering some interesting behavior between Edge and SharePoint.
tags: SharePoint Microsoft-Edge Chromium Electron.js Race-Condition
toc: true
published: true
---

# Introduction

I recently debugged an issue at work that I thought was worthy of a blog post. It yields some insight into how Edge and SharePoint operate, as well as some useful tools to track network traffic for chromium based browsers as well as electron apps.



# INFO

POST /_forms/default.aspx

MALFORMED COOKIE:   RpsContextCookie


WHERE IS IT SET? 
WHY? 


https://ntp.msn.com/edge/ntp?locale=en-US&title=New%20tab&dsp=1&sp=Bing&query=enterprise&prerender=1


## Packet capture

Tried burp (interfered with Windows Integrated Authentication WIA)
Frida - required root

Solution?
Command line! 

Works with electron.js apps and chromium based browsers!


## Fiddler

Reading the output from above can be done in Fiddler using extension [FiddlerImportNetlog extension](https://github.com/ericlaw1979/FiddlerImportNetlog)

**>> ADD COLUMNS for POST request**

## SharePoint


## Edge Functionality: New Tab Page (NTP)
Interesting post [xss New Tab Page](https://leucosite.com/Edge-Chromium-EoP-RCE/)




## Resolution
I think the GPO is machine level, but maybe user? I'm not sure.


When editing with Local Group Policy Editor:

Computer Configuration > Administrative Templates > Windows Components > Microsoft Edge

Setting: Allow web content on New Tab page
Value: Disable


AND / OR,

If we can set a policy so the new tab page uses this url:

Setting: Set New Tab page URL
Value: chrome-search://local-ntp/local-ntp.html

There's also a setting in Edge "Preload the new tab page for a faster experience". It's interesting, but the other settings are preferable.



I'm trying to prevent calls to ntp.msn.com