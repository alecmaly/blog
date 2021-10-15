---
layout: post
title: Hacking Electron Apps&#x3a; Joplin
description: Adding custom functionality to the Joplin note-taking app by injecting arbitrary JavaScript into source code.
tags: Electronjs Joplin JavaScript TypeScript reverse-engineering PowerShell
toc: true
---

## Introduction

In my previous post, [Adventures in Open Source Contributing&#x3a; Joplin]({{ '/2021/10/11/Adventures-in-open-source-contributing-Joplin.html' | relative_url }}), I went over how I have contributed a useful feature to the Joplin open source project. 

But what do you do if you want to change functionality to fit your extremely specific use case? A use case that nobody else needs Ior even wants at all)?

<div style='color:red; font-size: 2em; text-align:center'>You hack it!</div>

Ok, I should mention here that Joplin actually does have a plugin system with various available [API's](https://joplinapp.org/api/overview/) to extend Joplin's core functionality, and there are some really cool projects like [Note Tabs](https://github.com/benji300/joplin-note-tabs) that provide some great functionality such as pinning a collection of notes you plan to reference repeatedly. 

That said, after poking around briefly, I noticed I couldn't inject custom code as it's a security risk (good on you Joplin devs), and I lacked the willingness to learn the API deeper to work through my issue... that, and hacking the client seems **so much more fun**!

## The Use Cases

While I started with the first use case, I ended up implementing a few more that I found useful; it was easier than going through the effort of updating the main project or creating a plugin since I will be able to execute arbitrary JavaScript.

### Use Case 1: Filtering long pages by markers

In my learning I often take useful information and add it to my notes. I then annotate and add more information or links I find useful. In one instance, I have read through and copied what I found to be the most useful for [linux privilege escalation by hacktricks](https://book.hacktricks.xyz/linux-unix/privilege-escalation).

The total document is about 1655 lines long in markdown, quite large.
![](/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-12-46-35.png)

In Joplin, I've added a table of contents to jump around the massive document (shown on the right).
![](/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-12-50-07.png)

While this is useful, I would like a way to filter this massive file to just the most important items and expand my scope from there as I move forward.

To do this, I ended up 'marking' important sections in my note with stars:
    - Four stars (\*\*\*\*) for very important sections
    - Three stars (\*\*\*) for the next important sections
    - For each section, I would like to display a certain number of sections above or below depending on relevant content, so I add a prefix or suffix number to show that many pages. For example, 2\*\*\*\*4 indicates I want to show 2 sections before the target and 4 sections after it, they may be related or important info.

The filtering is controlled by (a) buttons that can toggle between 3/4 stars, anything marked with a star, and showing the entire document with the "Clear Stars" button.

![](/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-16-53-23.png)

As you can see, there is no way this would be added as the design is so clunky it just feels weird and unpolished. That said, I want it, and the idea of hacking the client app (for learning purposes) is just too juicy to pass up.

### Use Case 2: Filtering Workbooks

Typically, when searching in Joplin (a) it will search your notes, however, your notebooks (b) will remain unfiltered. I would like to add functionality to filter the workbooks as it sometimes helps me find related content quickly.

<div>
    <div style="display: inline-block; width: 49%;">
        <p class="codeblock-label">Before</p>
        <img src="{{ '/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-12-56-29.png' | relative_url}}" alt="notebook search before"/>
    </div>
    <div style="display: inline-block; width: 49%; vertical-align: top">
        <p class="codeblock-label">After</p>
        <img src="{{ '/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-13-10-33.png' | relative_url}}" alt="notebook search before"/>
    </div>
</div>

Clearly, the filtered list in the "After" image is much cleaner and allows me to easily find some results that are still relevant while not showing up in normal search results. Implementing my own version here will take less time than digging through the code's source to figure out a way to do it properly. 


### Use Case 3: Copy button on code snippets

Sometimes I want to just copy a code snippet with a single button click, so I added a button to add the content of a code block to my clipboard.

![copy to clipboard](/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-13-52-06.png)


<hr>
With these use cases in mind as the goal, it's time to get into the process of actually modifying the Joplin client! 
<hr>

## Hacking Electron Apps

I prefer to avoid explaining information that is better explained elsewhere using a simple google search, but here are the basics.

### Basic Electron.js Structure

Electron apps are typically installed and code is executed out of an .asar file.

![](/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-14-05-22.png)

These .asar files are essentially .zip files in the sense that they are a compressed collection of files.

<p class="codeblock-label">To unpack it, just install the <a href='https://github.com/electron/asar'>asar cli</a> using npm:</p>
```bash
npm install -g asar
```

<p class="codeblock-label">And unpack the .asar into a folder of .js source code</p>

```bash
asar extract <app.asar> <destination_folder>
```

### Injecting custom code

To inject custom code, you must:

1. Unpack the .asar file into a folder
2. Find a suitable entrypoint for your code
    - Ideally this is a .js file that is executed only once, where you will inject your custom .js payload.
3. Write your payload.js
4. Inject into the entry-point (step 2) and load your payload (step 3)
```javascript
// injected into target entry_point.js file 
require('.\\joplin_inject_code.js')
```
5. Rename/delete the original .asar such that reloading the app will look in our .js files in the extracted folder for the code to execute.

## My Project: Joplin Example

Source code can be found [here](https://github.com/alecmaly/joplin-customization); note that this is set up for a Windows 10 environment.

The main two files in this repo are the driver [patch_joplin.ps1](https://github.com/alecmaly/joplin-customization/blob/master/patch_Joplin.ps1) and [joplin_inject_code.js](https://github.com/alecmaly/joplin-customization/blob/master/joplin_inject_code.js).

Ultimately, if I update joplin, all I have to do is clone the repo and run `.\patch_joplin.ps1` to reinject my payload automatically.
> This assumes dependencies such as npm and asar are installed.<br>
> Must be run as Administrator if the target .asar / folder has restricted permissions (as it should).

```powershell
git clone https://github.com/alecmaly/joplin-customization.git
cd joplin-customization
.\patch_joplin.ps1
```

### joplin_inject_code.js ([source](https://github.com/alecmaly/joplin-customization/blob/master/joplin_inject_code.js))

This is just the custom .js code that will be injected into the process; it implements the use cases described above. It is copied to `C:\Program Files\Joplin\resources\app\joplin_inject_code.js` where it can be modified in the future and will be loaded upon reloading the application via the hook (`require('.\joplin_inject_code.js')`) in the entry point file `\app\app.js`.

### patch_joplin.ps1 ([source](https://github.com/alecmaly/joplin-customization/blob/master/patch_Joplin.ps1))

The purpose of this PowerShell script is to automate the process of injecting the custom JavaScript into the Joplin source code.

Joplin is installed by default in `C:\Program Files\Joplin\resources`.<br>
The entry point I identified is located at the relative path `\app\app.js`.

This flow of this script is as follows:
- Select `rebase` OR `update`
    - A `rebase` will essentially extract the .asar to a folder, rename the original .asar to .asar.bak, and inject your custom code into the entrypoint of `\app\app.js` using some regex to place the payload exactly where I want it.
    - A `update` will just try to reinject the custom code if needed.
- Both `rebase` and `update` will copy the payload from this repository into the Joplin repository `C:\Program Files\Joplin\resources\app\joplin_inject_code.js`

This script also does some sanity checks to make sure Joplin is closed when you run it, and includes a marker with the injection such that if the script is run a second time it does not repeatedly inject into the target entry point. 

Running the script results in:

- (a) app folder with Joplin source code .js/.ts files and (b) app.asar renamed to app.asar.bak.

![](/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-14-50-07.png)

- The contents of /app now include my payload `joplin_inject_codoe.js` file

![](/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-14-51-33.png)

- And my import statement to my payload being added to `\app\app.js` with the unique marker to prevent multiple import statements on subsequent runs of `patch_joplin.ps1`.

![](/assets/posts/2021-10-12-Hacking-Electron-Apps-Joplin/2021-10-14-14-49-31.png)



## Customization via. Injection

### Pros / Cons

**Pros**
- Customizability. Ultimately, it's really easy to modify and add whatever custom functionality you want.
    
**Cons**
- Highly fragile. May have to modify injected code depending on updates to the main program.
- Must be reapplied with every update.


### Discord, Microsoft Teams, Github Desktop, VS Code, and More!

There are several electron.js apps these days which can be found listed [here](https://www.electronjs.org/apps). 

**Microsoft Teams: A thought experiment**

> Be aware of EULA and laws when tinkering with any software. Stay ethical, don't do bad things, don't break the law.

Microsoft Teams is a popular tele conferencing /chat app (and more). One of the features is a chat feature that includes read receipts. This feature can be disabled so others cannot see that you read their message, however, this also means that you cannot see if they read your message. Both parties must have this feature enabled to see if the other has read their messages.

One can imagine a scenario where it would be nice to see if others have read your messages while blocking the other party from seeing if you have read their messages. Enter injection. The perfect solution to this problem as this feature will never be added by Microsoft.

**Other Examples / Use Cases**
 
Others have injected/modified code to change the looks or behavior of apps like [skype](https://www.codepicky.com/hacking-electron-restyle-skype/) or [discord](https://dev.to/essentialrandom/adventures-in-hacking-electron-apps-3bbm) to modify the minimum window size.

## Conclusion

Electron apps have become pretty popular due to their portability, and lucky for the aspiring modder they are super easy to customize! Please remember to act responsibly and never stop exploring the possibilities! 