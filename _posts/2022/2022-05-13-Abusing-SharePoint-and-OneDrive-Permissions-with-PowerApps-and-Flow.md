---
layout: post
title: M365 Internal Phish | Abusing SharePoint and OneDrive API with Power Apps and Power Automate
description: >-
    An internal phishing POC leveraging Microsoft 365 citizen development tools (Power Platform). Subtly gain access to a target user's OneDrive / SharePoint sites they own. A YouTube video of the POC v1 can be found here: https://youtu.be/xXqFhN4wyGY
tags: Microsoft PowerApps Power-Automate SharePoint OneDrive Phishing M365 POC Cloud Hacking Privilege-Escalation
toc: true
published: true
---

## Public Service Announcement to All Power Platform Users

This vulnerability was submitted to Microsoft via their [vulnerability disclosure program (VDP)](https://www.microsoft.com/en-us/msrc/bounty-dynamics?rtc=1) and was designated: <span style='color: red; font-weight: bold'>Critical - Elevation of Privilege</span>. This was my first submission to a public VDP and I'm so excited it was accepted!

One note of warning. While Microsoft resolved the report, the technique still works (as of a couple of months ago). For remediation, Microsoft has only implemented a warning when opening a malicious Power App, so this is a PSA to all Power Platform users of the dangers of opening apps or running Power Automate workflows from unknown/untrusted sources. 

If you attempt to re-create the Proof of Concept in this post, I last worked on this side project months ago and functionality may have changed. You may need to do some work to get it to work (if it even still works).

## Introduction

The Office/Microsoft 365 suite has become incredibly powerful and gives power users in an organization the ability to quickly develop useful tools to help their business operate at peak performance. These tools are becoming more mainstream as businesses continue to adopt the suite, putting these tools in the hands of their employees. However, much like the Office suite (Word, Excel, PowerPoint, etc.) has been abused with embedded macros, the Power Platform offers some interesting ways to abuse it's extensive feature set leading to some unexpected results. While endpoint antivirus has become increasingly decent at catching embedded visual basic scripts detection on strange cloud activity is far less robust. 

> An aside: Anyone curious about malicious Office document tampering, there has been some amazing research into techniques such as [vba stomping](https://www.google.com/search?q=vba+stomping) or the newer [vba purging](https://www.google.com/search?q=vba+purging). I would recommend looking into them as they are quite fascinating. 

Power Automate is a tool used to automate tasks in the Microsoft 365 environment, and through some experimentation, I found a way to potentially abuse it to escalate privileges in SharePoint/OneDrive through an internal phishing type scenario. The key here is that in the past, only administrators or assigned individuals would become Site Owners with Full Control or Site Collection Administration permissions on a SharePoint site - i.e. privileged users that can add/remove other users from the permissions of a site. Lately, however, between custom tenant settings and the surge in Microsoft Teams, an increasing number of regular users are put in positions where they can add/remove users to/from their SharePoint sites and Microsoft Teams. Another important note is that Microsoft Teams will spin up a SharePoint site in the background that houses the documents placed in the Microsoft Team's `Files` tab. Also, by default, each user is a Site Collection Administrator on their own OneDrive site, allowing the user to share documents in their OneDrive's at will. This increased usage of Teams and lax default permissions is what we will be investigating in this post.

Today, I will demonstrate how to create a Power App with an embedded Power Automate workflow that grants an "attacker" (Bad Actor) the Site Collection Administrator role on the target's OneDrive as well as several sites the target is an owner of. Thus, the attacker would have access to potentially sensitive files that they should not have access to; this is especially interesting as SharePoint and OneDrive are sometimes replacing on-prem storage in a multitude of use cases, and the amount of sensitive data stored in these cloud solutions is only increasing year after year.

## How does it work?

The idea is that a bad insider creates a malicious Power App with an embedded Power Automate workflow and social engineer a target employee to open it (by asking the target for feedback on their app, embedding it in a popular site/Microsoft Team tab, etc). The workflow that executes automatically, in the background (upon opening the app), will run actions under the context of the victim. The workflow first uses the SharePoint API to find all sites the victim has access to, then tries to **grant the attacker Full Control / Site Collection Administrator (SCA) permissions to the target's OneDrive and any site the target has Site Collection Administration / Full Control (Site Owner) permissions to**; keep in mind that the current default for modern Team sites is that the creator/owners of the Team/M365 Group is granted SCA permissions of the site. 

The malicious Power Automate workflow uses [SharePoint HTTP actions](https://docs.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/guidance/working-with-send-sp-http-request) to execute actions in SharePoint/OneDrive on behalf of the victim opening the Power App. Once the Power App is opened, the workflow is automatically triggered, and the victim unknowingly grants access to their SharePoint/OneDrive sites to the attacker. 

Additionally, an important note is that upon opening the Power App, the target is prompted to allow permissions, however, the kicker is that the message ~~is~~ was **extremely generic, very common, and non-descript**. The permissions prompt is only for SharePoint, which is often used as a data source for Power Apps because it's the easiest storage option that is typically available for most M365 license types. In other words, this permissions prompt ~~doesn't~~ didn't look suspicious at all... 

### Microsoft Permissions Prompt Update

Microsoft has since updated the permissions prompt to display a warning when HTTP actions are used. Note that this seems to be the only change Microsoft made after my bug report and **this attack is still possible!**

#### Before Microsoft Update

The permissions are ambiguous.

[![](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-18-08-15-44.png)](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-18-08-15-44.png)

Not only does it not show OneDrive listed, but clicking "View Permissions" yields a screen that doesn't seem to fully indicate that this app can force you to grant permissions on your OneDrive and SharePoint sites to another user.

[![](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-18-08-17-38.png)](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-18-08-17-38.png)

#### After Microsoft Update

The updated permissions prompt has a `show warnings` collapsable menu.<br>
<span style='color: red'>Users should be very cautious when opening Power Apps and see this permissions prompt!</span>


[![](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/20220512210405.png)](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/20220512210405.png)  

which expands to the following

[![](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/20220512210438.png)](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/20220512210438.png)

## Proof of Concept

> Notes: 
>
> - The site enumeration part of this POC leverages the SharePoint search API and does NOT paginate results. To find all sites, this section should be modified.
> - An action can be appended to the end of the workflow to output all sites that you have been granted permissions to, perhaps by `SharePoint | Create Action` in a public SharePoint list (don't forget to disable indexing so it won't be found through SharePoint search), Email `Outlook | Send an Email`, or other similar methods. 

As mentioned above, I have posted a [YouTube POC](https://youtu.be/xXqFhN4wyGY). The POC in the video is a bit different than the one shown below, so keep that in mind if you try this yourself. 

### Steps

1. Create/Import a malicious Power Automate workflow using the template .zip: [POC-POC-M365Phish_20220513062553.zip](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/POC-POC-M365Phish_20220513062553.zip)

    Importing may be troublesome and have some errors. The following details may help resolve the issues. If not, then just create a new workflow and manually create each step.

    If uploading fails with this message, just try to upload again:

    [![](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/20220512220803.png)](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/20220512220803.png)

    If uploading fails and this message appears, select the `save as a new flow` link.

    [![](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-17-21-21-03.png)](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-17-21-21-03.png)

    Then fix all connections by (1) clicking the broken connection and (2) using your login credentials

    [![](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-17-21-23-12.png)](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/2021-10-17-21-23-12.png)


2. Create a Power App that calls the workflow OnStart with the following parameters. The parameters for the function are (1) the victim's email, (2) the domain of the tenant (this can be hardcoded, my quick attempt at regex will probably not work in all environments) (3) the attacker's email (**update this**).

    ```bash
    'POC-M365Phish'.Run(User().Email, First(MatchAll(User().Email, "(?<=@)[^.]+(?=\.)")).FullMatch, "attacker@domain.onmicrosoft.com")
    ```

    [![](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/20220512232924.png)](/assets/posts/2022/2022-05-13-Abusing-SharePoint-and-OneDrive-Permissions-with-PowerApps-and-Flow/20220512232924.png)  

3. Share the app with a victim user 

4. Have the victim user open the malicious app, similar to a phishing attempt. The victim should click "Allow" at the permissions prompt.

## Detection / Prevention

As mentioned previously, always check the permissions prompts when opening a Power App and ensure you don't see anything unexpected. Only open Power Apps with SharePoint HTTP actions from trusted sources. 

In terms of scanning for malicious workflows in your environment, there may be options to use the [Power Platform PowerShell SDK](https://docs.microsoft.com/en-us/power-platform/admin/powerapps-powershell), however, the last time I checked the functionality was rather limited. It's something you'd have to play around with.

It may also be worth looking at the M365 Unified Audit logs for high-level permissions being granted to an individual across several sites or looking at other interesting indicators. Again, I don't have a practical script to provide here and this method may also be resource-intensive as there would be a lot of logs to sift through. 

While there are a few options to try and automate detection, I can't think of an out-of-the-box method for easily spotting this attack. I welcome comments (requires Github account) and would love to hear others' thoughts on this.

## Vulnerability Reporting / Resolution Timeline

- Oct 18, 2021: Reported to Microsoft
- Oct 20, 2021: Status chaged to Review / Repro
- Feb 15, 2022: Status changed to Develop
- Mar 28, 2022: Status changed to Pre-Release
- Mar 28, 2022: Status changed to Complete