---
layout: post
title: DRAFT | Abusing SharePoint and OneDrive Permissions API with Power Apps and Power Automate (Microsoft Flow)
description: >-
    An internal phishing POC leveraging Office 365 citizen development tools.
    Subtly gain access to a target user's OneDrive / SharePoint sites they own.
tags: PowerApps Power-Automate SharePoint OneDrive Phishing O365 POC
toc: true
published: true
---

## Introduction

The Office 365 suite has become incredibly powerful and gives power users in an organization the ability to quickly develop useful tools to help their business operate at peak performance. These tools are becoming more mainstream as more and more businesses adopt the suite and put them in the hands of their employees. However, much like the office suite in the past has been abused with embedded Visual Basic macros leading to code execution, the Power Platform offers some interesting ways to play with some of what I can only assume to be some unintended functionality. While endpoint antivirus has become increasingly decent at catching embedded visual basic scripts detection on strange cloud activity may be a little less explored. 

> An aside: If one is curious about Office document tampering, there has been some really amazing research into techniques such as [vba stomping](https://www.google.com/search?q=vba+stomping) or the newer [vba purging](https://www.google.com/search?q=vba+purging). I would recommend looking into them as they are quite fascinating. 

I wouldn't really classify this functionality as a bug, but it definitely lies in a grey area and can be abusable. The key here is that in the past, only administrators or assigned individuals would become site owners with Full Control or Site Collection Administration permissions on a site - users that can add/remove other users from the permissions of a site. Lately, depending on tenant settings, the advent of products such as Microsoft Teams provide a convenient way for the average employee to spin up a place to house data and documents alike. An important note is that Microsoft Teams will spin up a SharePoint site in the background that houses the documents placed in the Team's 'Files' tab. This increased usage of Teams and lax default permissions is what we will be investigating in this post.

Today, I will demonstrate how to create a Power App with an embedded Power Automate workflow that grants the "attacker" the Site Collection Administrator role on the target's OneDrive as well as several sites the target is an owner of. Thus, the attacker would have access to potentially sensitive files that they should not have access to; this is especially interesting as SharePoint and OneDrive are replacing on-prem storage and the amount of sensitive data stored in these solutions is only increasing year after year.

## How does it work?

The idea is that a bad insider could create a malicious Power App with an embedded Power Automate workflow and social engineer a target employee to open it (by asking the target for help, embedding it in a popular app, etc). The workflow that runs in the background (upon opening the app) will grant the attacker Site Collection Administrator (SCA) permissions to the target's OneDrive, and potentially any site the target has Site Collection Administration permissions to; keep in mind that the current default for modern Team sites is that the creator/owners of the Team/O365 granted SCA permissions of the site. 
 
Additionally, an important note is that upon opening the Power App, the target is prompted to allow permissions, however, the kicker is that the message is **extremely generic and very common**. The permissions prompt is only for SharePoint, which is often used as a data source for Power Apps because it's the easiest storage option that typically available for all O365 license types. In essence, this doesn't look suspicious at all...

---- INSERT PHOTO OF PERMISSIONS PROMPT ----

This works because when the target opens the Power App, the workflow gets automatically triggered. The SharePoint actions in the Power Automate workflow run under the context of whoever opened the Power App (or whatever connection credentials were specified by the target, really). Since the SharePoint actions are running under the permissions of the target, and OneDrive is just a personal SharePoint site, the workflow can use the target's credentials to grant permissions of these assets to the attacker(s).

## The Details

So, let's jump into the meat of the workflow as it's the asset doing all the work.




### Importing

[![](/assets/posts/2021-10-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-17-21-21-03.png)](/assets/posts/2021-10-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-17-21-21-03.png)

Then fix all connections by (1) clicking the broken connection and (2) using your login credentials

[![](/assets/posts/2021-10-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-17-21-23-12.png)](/assets/posts/2021-10-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-17-21-23-12.png)


The permissions are ambiguous.
[![](/assets/posts/2021-10-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-18-08-15-44.png)](/assets/posts/2021-10-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-18-08-15-44.png)

Not only does it not show OneDrive listed, but clicking "View Permissions" yields a screen that doesn't seem to fully indicate that this app can force you to grant permissions on your OneDrive or SharePoint sites to another user.

[![](/assets/posts/2021-10-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-18-08-17-38.png)](/assets/posts/2021-10-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-18-08-17-38.png)



