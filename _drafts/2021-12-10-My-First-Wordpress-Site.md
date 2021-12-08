---
layout: post
title: DRAFT | My First Wordpress Site | olgastherapy.com
description: >-
    My experience with trying to stay up to date with cybersec using inoreader.io, youtube, podcasts and other resources. These techniques can be leveraged for journalists or other 
    people who need to stay in the know.
tags: Wordpress Web Development
toc: true
published: false
---

## Introduction

I'm not gonna lie, this whole article is just for a backlink, however, it will still include useful info for anyone getting started with Wordpress.

My wife has just started her own private practice as an LLPC! I have spent the past few weeks learning Wordpress and standing up a site and brarnded email. In this article I will lay out my perspective of building Wordpress from the ground up with no experience.

My goal was so spend as little money while also creating a quality solution.

This post will serve as a base for my current settings and choices in theme + plugins so anyone else that is new to Wordpress can try to learn from my experience. Additionally, I've added some general experiences in other facets of starting a business such as customizing a QR code and configuring DNS to support email on our bluehost server.

## Choosing a Hosting Service

This is the first major decision where you can easily end up with analysis peralysis. There are [soo many hosting providers](https://www.codeinwp.com/blog/best-wordpress-hosting/) that range in price and features. Ultimately, I ended up choosing shared hosting on [bluehost](https://www.bluehost.com/) because it had a promotion for only $2.50/mo for the first 12 months and included an email server I could configure for custom emails. 

I should note that my plan is a shared hosting environment, this is very cheap because several other people's websites are also hosted on this server. It makes my webserver more vulnerable as I cannot control the coding practices of the other people on my server. Additionally, it means my server is SLOW. To compensate for these major issues, I needed to consider a decent backup and caching solution to ensure I don't (a) lose all my data in the event of a hack and (b) can serve my website quickly despite the lack of resources on the shared host. 

## Branded Email

Since I chose Bluehost as a provider, I had to configure DNS so we could connect to our mail server and send/receive messages.


### DMARC, DKIM, and SPF



## Branding

I'm not good at design and much prefer back-end work. That said, it's important to make the site look... decent. Luckilly, my uncle made some AMAZING logos and we 

### QR Code 

[This was a great site](https://www.qrcode-monkey.com/) to create a custom QR code as it provides a lot of options for customization. We placed these business cards and it adds a nice touch.








## Themes

### Customizations: Child Themes

So, now that I have my Theme chosen and paid for, I still need to customize it. There is a concept of [Child Themes](https://developer.wordpress.org/themes/advanced-topics/child-themes/) in Wordpress so you can essentially modify some functionality in your Theme with  middleware and not risk having the Theam break on an auto-update. 

## Plugins

I will split this next section into categories as each plugin has it's own purpose.

### Pre-Innstalled Plugins

I am hosting with Bluehost and they had a few plugins come pre-installed in my Wordpress instance such as 




### Content Creation

### Performance

Getting caching and optimizations has been proven to be quite an intense experience. Mainly because there

#### wp-rocket




### Security











## NOTES / TOPICS

1. Themes
There are a million of them. Several are free, others are paid. I tried using a free theme thinking I can customize it myself as a developer and quickly ran into issues where it was just too much work patching all the broken pieces. I ended up buying the Astra theme, creating a child theme for a couple minor tweaks, and customizing my site easily. Also learning that this ties well with Elementor (and learning what page builder plugins are in general) would have been nice to know moving into this project. The Astra custom theme was well worth the money. I think for anyone that plans to do this themselves, it would be useful to know that shelling out a couple dollars for a responsive, customizable theme can pay dividends in time saved and reduced frustration.

2. Child Themes
As a tinkerer, I want to make small tweaks to my site. It’s worth mentioning that you can create a child theme to add some customizations (like removing the featured image from blog posts) for more control on their site.

3. Pre-installed Plugins
It would have been useful to know that hosting providers pre-install plugins that you may want to remove or use a different version of. For instance, my host (Bluehost) installed Jetpack, the caching plugin. There is no free version of Jetpack. I completely removed this and added a variety of other plugins to my site. See below for details.

4. Plugins
The subscriptions. The confusion is that every plugin seems to be a subscription model. It would have been useful to know that you don’t need to continue the subscription every year, it’s only there if you want continuous updates to the plugin. You can use this to your strategic advantage if you are strapped for cash as a newly created small business. I currently purchased the Astra plugin for 1 year of support, and plan to upgrade to a lifetime license in a few months once we turn a profit. The Astra theme is the backbone to the site and it makes sense to invest in lifetime updates. The other plugin I got was JetBlog for a better blog landing page. I don’t plan on subscribing for updates to this. If it breaks, I will re-point the page to the default Wordpress blog page and work on a replacement - either purchasing the plugin again to download the newest version or finding another replacement.

In short, it would have been useful to know subscription fees for plugins may not be mandatory, depending on what they are (if you are willing to take the risk of them breaking).

4. Caching
Where do I start, this was so confusing I spent an entire day just researching. There are a million plugin options and it’s hard to understand where the overlap of each begins and ends. Making sure your features like “fuzzy loading” are not enabled in multiple plugins or they may interfere with each other and break the intended functionality, etc. I landed on using optimole for responsive images, W3 Total Cache for local cache (make sure to disable fuzzy loading images as optimole will do that + disable minify as Cloudflare will do that), and cloudflare as a CDN (enable minify of static assets). Navigating this plugin option whirlwind may be an interesting conversation for your listeners. Other options for image caching that I may still test with are ShortPixel Adaptive Images and Imigafy.

5. Maintenance
Backups are important. I use the free version of UpdraftPlus. There is another plugin called WP-Sweep for cleaning the server of cached files like unused draft posts. This is pretty useful.

6. SEO + structured data
Yoast came pre-installed with bluehost, however, I opted to uninstall it and replace it with Math Rank as it’s free version is pretty feature packed. The important note is that to take full advantage, you should fill out all the fields in the settings of plugin (e.g. business address, etc.). Just installing it only helps minimally. Also, in looking at other therapist websites, I notice FAQ pages on sites with Yoast installed that don’t take advantage of structured metadata as to take advantage of it, you must use the yoast FAQ widget.
https://yoast.com/how-to-build-an-faq-page/ 

Not only that, but I see limited structured metadata and rich snippets using the ld+json <script> tags across sites in general. This could be an interesting conversation with your listeners. While structured metadata may not affect SEO and get you to the top page, it definitely can improve the way your site looks within the search results section, improve user experience, and increase changes someone looks at your site.

I haven’t launched my site yet so I’m still unsure how this will all actually pan out in practice, but I have looked some sites using this google tool (https://developers.google.com/search/docs/advanced/structured-data) and I can definitely tell you there is a general lack of usage of SEO schema markup for therapist sites in my area.

More info can be found here:
https://moz.com/learn/seo/schema-structured-data  

I think this may be an interesting topic for your podcast and I don’t think I’ve heard you mention it before. I just learned about it within the past couple days and it doesn’t seem to be highly utilized. 

7. Security
Brute forcing login credentials is a common practice on Wordpress sites. Using plugins like Loginizer to prevent brute force attempts is a good idea. Also, hosing on a platform like Cloudflare can help with DOS/DDOS attacks. 

8. Staging sites
Again, I’m not 100% sure, but I don’t think I remember the topic of staging sites coming up. I may be wrong. This may be another good topic for your audience as several hosting providers offer one click staging environments to test major updates with reduced risk of breaking your site. 

9. Email + DNS? 
Bluehost offers an SMTP server with my hosting plan. I ended up configuring the DNS server (also worth noting that configuring a CDN like Cloudflare may result in having to configure DNS there was well) to route email with proper DMARC/DKIM/SPF records. Honestly, this gets a bit too technical for a podcast’s content, I think; however, maybe just mentioning that branded emails with custom domains may be a consideration when choosing a hosting provider. I did a bit of work to configure it with Bluehost, however, other options like Google Business offer similar services for an extra $8/mo or so. I’m not sure if other hosting providers include email servers or not in their pricing, so I thought I would mention this as a possible talking point. 

POP3 vs. IMAP
This is important if setting up your own email server. When accessing email, it would have been useful to know that gmail doesn’t support IMAP, and neither does the Outlook web version. There are several email clients, I ended up landing on Outlook client apps and disabling focused inbox because that setting is confusing. This is important if you plan to access email on multiple devices like your phone+computer. POP3 is mainly used if you only access email on one device and you can confusingly end up with multiple emails in your inbox as several devices try to sync and copy emails between the email server and your local device.


Conclusion
I’m cheap (well, we just don’t have a lot of money right now). After all of this I have my wordpress site up and running for under $100 for the first year, it just took a lot of work. Complete with backups, some security against brute force, both server and cloud caching, responsive images, and cleaning tools like WP-Sweep to ensure my server doesn’t get cluttered over time, AND a custom email domain with all the proper security policies in place to ensure emails don’t get blocked from being flagged as spam/spoofed email. Hopefully someone else can use my experience and cut their research time in half.

P.S. I still have to get the proper content from my wife to launch the site, so it could explode and everything could break. Since we have no blog content yet, it’s hard to know how the structured schema + snippets will work out, but I still think it’s a topic worth mentioning.


10. SEO tools
google cloud counsel




