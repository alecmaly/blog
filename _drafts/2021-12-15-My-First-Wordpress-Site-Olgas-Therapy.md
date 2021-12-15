---
layout: post
title: DRAFT | My First Wordpress Site | olgastherapy.com
description: >-
    Learning wordpress and email hosting.
tags: Wordpress Web Development Email Configuration
toc: true
published: true
---

## Introduction

My wife has just started her own private practice as an LLPC! I have spent the past few weeks learning Wordpress and standing up a site and brarnded email. In this article I will describe my perspective of building a Wordpress site from the ground up with no experience.

My goal was so spend as little money as possible while also creating a quality solution.

This post will serve as a base for my current settings and choices in theme + plugins so anyone else that is new to Wordpress can try to learn from my experience. Additionally, I've added some general experiences in other facets such as configuring email, customizing a QR code, and anything else I think other's may find particularly useful.

## Choosing a Hosting Service

This is the first major decision where you can easily end up with analysis peralysis. There are [soo many hosting providers](https://www.codeinwp.com/blog/best-wordpress-hosting/) that range in price and features. Ultimately, I ended up choosing shared hosting on [bluehost](https://www.bluehost.com/) because it had a promotion for only $2.50/mo for the first 12 months and included an email server I could configure for custom emails 

> Note, Bluehost email is not HIPAA compliant so we did not use it. However, it is worth noting depending on your needs.

### Shared Hosting vs. Virtual Private Server (VPS)

I should note that my plan is a shared hosting environment, this is very cheap because several other people's websites are also hosted on this server. It makes my webserver more vulnerable as I cannot control the coding practices of the other people I share a server with. Additionally, it means my server is SLOW. To compensate for these major issues, I needed to consider a decent backup and caching solution to ensure I don't (a) lose all my data in the event of a hack and (b) can serve my website quickly despite the lack of resources on the shared host. These considerations are expanded upon later in this post when I describe my plugins, specifically the WP Rocket (caching) plugin and the Updraft Plus (backup) plugin.


## Branding + Design

I'm not good at design and much prefer back-end work. That said, it's important to make the site look... decent. Luckilly, my uncle is a graphic designer made some AMAZING logos we could start from. I asked for these logos in SVG format and could easily pull the colors in hex format from the SVG/XML markup. 

## Themes + Plugins

When it comes to Themes and Plugins, you'll be swirling in a soup of options and overlapping features. My best advice here is to not be cheap. Spending that extra $ can seriously make your life significantly easier. That said, don't go out and buy everything in an instant, it really takes quite a bit of reasearch to evaluate what makes sense to purchase and what you can do for free. Just make sure that whatever you are using is actively receiving updates and isn't a dead product as it could result in reduced security on your site.

### Subscriptions

The confusion is that every theme + plugin seems to be a subscription model. It would have been useful to know that you don't need to continue the subscription every year, it's only there if you want continuous updates to the plugin. You can use this to your strategic advantage if you are strapped for cash as a newly created small business. I currently purchased the Astra plugin for 1 year of support, and plan to upgrade to a lifetime license in a few months once we turn a profit. The Astra theme is the backbone to the site and it makes sense to invest in lifetime updates. Another plugin I purchased was JetBlog for a better blog landing page. I don't plan on subscribing for updates to this. If it breaks, I will re-point the page to the default Wordpress blog page and work on a replacement - either purchasing the plugin again to download the newest version or finding another replacement.

In short, a new Wordpress developer should know subscription fees for plugins may not be mandatory, depending on what they are (as long as you are willing to take the risk of them breaking).


## Themes

There are a million of them. Several are free, others are paid. I tried using a free theme thinking I can customize it myself as a developer and quickly ran into issues where it was just too much work patching all the broken pieces. At one point I wondered what the point of a Theme actually was since I had bastardized it beyond recognition. I ended up buying the [Astra theme](https://wpastra.com/) which allowed much more flexibility and reduced frustration. Also learning that Astra ties well with [Elementor](https://elementor.com/) (and learning what page builder plugins are in general) would have been nice to know moving into this project. The Astra custom theme was well worth the money. I think for anyone that plans to do this themselves, it would be useful to know that shelling out a couple dollars for a responsive, customizable theme can pay dividends in time saved and reduced frustration.

> WHAT WAS I GOING TO PUT HERE?

### Customizations: Child Themes

As a tinkerer, I want to make small tweaks to my site beyond what is pre-packed in my theme. It's worth mentioning that you can create a child theme to add some customizations (like removing the featured image from blog posts) for more control.

There is a concept of [Child Themes](https://developer.wordpress.org/themes/advanced-topics/child-themes/) in Wordpress so you can essentially modify some functionality in your Theme with middleware and not risk having the theme break on an auto-update. To do this, just create a child theme and enter your middleware functions into the `functions.php` file. There are plenty of guides online on how to do this, I just mention it here as it may be worthwhile having this knowledge upfront when starting your first Wordpress project.


## Plugins

I will split this next section into categories as each plugin has it's own purpose.

### Pre-Installed Plugins

It would have been useful at the beginning to know that hosting providers pre-install plugins that you may want to remove. For instance, my host (Bluehost) installed Jetpack, the caching plugin. There is no free version of Jetpack. I completely removed this and several other pre-installed plugins and added a variety of other plugins to my site. See below for details. Just because a plugin was pre-installed by your hosting provider does not mean it is the best tool for the job. Do your research and pick the plugins that best fit your needs.

Plugins that you are not using should be disabled and uninstalled as they not only may cause your site to load slower, but can also be the target of hackers. 

### SEO

[**Rank Math**](https://rankmath.com/) - FREE

Yoast came pre-installed with bluehost, however, I opted to uninstall it and replace it with Math Rank as it's free version is pretty feature packed. The important note is that to take full advantage, you should fill out all the fields in the settings of plugin (e.g. business address, etc.). Just installing it only helps minimally. Also, in looking at other therapist websites, I notice FAQ pages on sites with Yoast installed that don't take advantage of structured metadata as to take advantage of it, you must use the yoast FAQ widget.
https://yoast.com/how-to-build-an-faq-page/ 

Not only that, but I see limited structured metadata and rich snippets using the ld+json \<script> tags across sites in general. While structured metadata may not affect SEO and get you to the top page, it definitely can improve the way your site looks within the search google search results section, improve user experience, and increase chances someone looks at your site.

I haven't launched my site yet so I'm still unsure how this will all actually pan out in practice, but I have looked some sites using this google tool (https://developers.google.com/search/docs/advanced/structured-data) and I can definitely tell you there is a general lack of usage of SEO schema markup for therapist sites in my area.

More info on schema structured data can be found [here](https://moz.com/learn/seo/schema-structured-data).

### Content Creation

[**Elementor**](https://elementor.com/) - FREE

The Theme I chose was Astra and it works well with Elementor. This is a page building plugin that helps build pages. As a developer, this makes my life easier as it's much faster to build out a page using Elementor rather than custom code. Perhaps, most importantly, I can teach my wife, who is not a developer, to easily create blog post pages using the page builder so she can create content freely and not have to rely on me to build out her site's content. I chose the free version of this plugin as I fill in the gaps with custom HTML and we run a simple site. More widget options are avaiable for the paid version. 

[**Astra Pro**](https://wpastra.com/pro/) - FREE \| [**Astra Hooks**](https://wordpress.org/plugins/astra-hooks/) - FREE \| [**Essential Addons for Elementor**](https://wordpress.org/plugins/essential-addons-for-elementor-lite/) - FREE

These all just offer more flixibility in page/blog creation.

[**WPForms Lite**](https://wordpress.org/plugins/wpforms-lite/) - FREE

For a contact form so clients can reach out for an initial consultation.

#### Blog Page

[**JetBlog For Elementor**](https://crocoblock.com/plugins/jetblog/) - PAID

Since my wife wanted to have an option to blog, I added a plugin to easily build the blog page. Wordpress has a built in page, however, I found I liked what this plugin had to offer for just $11 on Black Friday. I don't plan to purchase support for this plugin on a yearly basis, and my small investment made it easy to build a relatively nice blog landing page. 


#### Social Media

[**Grow Social by Mediavine**](https://wordpress.org/plugins/social-pug/) - FREE

Social Media plugin to show share buttons on blog posts. I wrote a custom `functions.php` script to add a button to easily copy the URL of the page as well.

[**Smash Balloon Instagram Feed**](https://smashballoon.com/instagram-feed/) - FREE

Display Instagram feed.


### Performance

Where do I start, this was so confusing I spent an entire day just researching. There are a million plugin options and it's hard to understand where the overlap of each begins and ends. Making sure your features like “fuzzy loading” are not enabled in multiple plugins or they may interfere with each other and break the intended functionality, etc. In my first attempt at doing this for free, I landed on using optimole for responsive images, W3 Total Cache for local cache (make sure to disable fuzzy loading images as optimole will do that + disable minify as Cloudflare will do that), and cloudflare as a CDN (enable minify of static assets). Other options for image caching that I may still test with are ShortPixel Adaptive Images and Imigafy.

Getting caching and optimizations has been proven to be quite an intense experience. Mainly because there are sooo many choices, both free and paid. I just wasn't getting the results I wanted, and there were still things that were missing without paying extra (e.g. css critical path / removing unused css). Since I had a page builder plugin, the amount of CSS + JavaScript my page has to load is quite large, so I wanted to reduce that load as much as possible; free plugins could only go so far. My ending solution is below:

[**Optimole**](https://optimole.com/) - FREE

Optimole is used for image optimization. Not only will they optimize images you upload to your Wordpress library, but they have their own CDN that will essentially optimize photos based on the client that opens your site. So, if someome opens your Wordpress site on a phone, optimole will lazy load images and dynamically replace your img src with a path to their own CDN with a scaled version of the optimized image. I found this to be quite fascenating. Optimole has a paid version, but our site is so small and has such a limited number of photos that I plan to use the free plan and see what kind of bandwidth it uses. If I run into capacity issues, I will probably disable Optimole and use [imagify](https://imagify.io/) to optimize images, at which point I will evaluate if the CDN solution makes sense to pay for with Optimole. 

[**WP Rocket**](https://wp-rocket.me/) - PAID
WP Rocket is some of the best money I've ever spent. After spending 2 days messing with a host of caching and minification plugins, I really just got fed up and opted to pay for WP Rocket. This offers local caching, tie-in to cloudflare to clear cache easily, css critical route and removing unused css, html/css/js minifying, defering + delaying JS/CSS, database cleaning, and a lot of flexibility in customizations. This plugin is AWESOME!

[**Asset CleanUp**](https://wordpress.org/plugins/wp-asset-clean-up/) - FREE

This plugin is cool as it allows you to disable JS/CSS on specific pages. For example, the JetBlog plugin I bought for the blog page and WP Forms are loaded on every page. I have disabled these except on the pages they are needed, thus reducing the amount of assets each page has to load.

### Security

[**Loginizer**](https://wordpress.org/plugins/loginizer/) - FREE

This plugin can deter brute force attempts to log into your site by IP blocking. The paid version can also change the default location of /wp-admin and has a few more features. I don't plan to upgrade as this site will not house critical data, but it is an interesting choice for sites hosting more sensitive data.

**Cloudflare**

While this is not a plugin, per say, it is connected to the WP Rocket plugin. That said, hosting on cloudflare offers some advantaves such as DDOS protection and other Web Application Firewall (WAF) protection. While I am on the free plan and usually does not have WAF protection, Cloudflare is a great company that cares about security. In the event of a major vulnerability, they have [a history of implementing protections to even free customers](/assets/posts/2021-12-15-My-First-Wordpress-Site-Olgas-Therapy/2021-12-15-11-11-28.png). Kudos to them on that!

### Backups

[**UpdraftPlus**](https://updraftplus.com/) - FREE
Backups are important. I use the free version of UpdraftPlus and connected a new gmail account. I have some automation in my Office 365 environment that pulls the latest backup once a week so if my website gets hacked and they somehow delete all my backups in google cloud, I still have them in an unconnected environment.

### Utility

[**SVG Support**](https://wordpress.org/plugins/svg-support/)

Allows uploading SVG files to Wordpress.

### Maintenance

[**WP Mail SMTP**](https://wpmailsmtp.com/) - FREE

I use the WP Forms free version that sends an email upon form completion to the email of your choice. By default, this used the Bluehost email that was not HIPAA compliant. This plugin allows me to modify the email to use our HIPAA compliant Gmail account. I have created an admin email account with less privledges to connect to this site and exercise the principal of least privilege. 

[**WP-Cron Status Checker**](https://wordpress.org/plugins/wp-cron-status-checker/) - FREE

By default, the WP Rocket caching plugin uses WP-Cron. I have read this can be flaky if you don't log in for a while, so this plugin will send me emails on failures. If needed, I will replace this with a true cronjob on the system.

[**WP-Sweep**](https://wordpress.org/plugins/wp-sweep/) - FREE

A great little utility to clean your WP database. WP Rocket has a database cleaning function as well, however it seems like WP-Sweep gets one or two more things that may prove to be useful in the future. I am holding off on deleting this until I better understand what gaps exist between WP Rocket and WP-Sweep for database cleanup.

**Bluehost**

This plugin is automatically installed by my hosting provider (Bluehost) and creates a bridge between Bluehost and my site.

## Additional Notes / Topics

Here I will list several useful resources that may or may not directly relate to the Wordpress site itself. These should be useful for those creating their wordpress site or starting a business.

### Staging sites
A staging site is basically a duplicate of your Wordpress site where you can experiment with plugins and changes to your site against a test environment. Bluehost offers a free staging site, so I would imagine other hosting providers offer similar services as well.  

### Design / Color Pallets

It's nice to have a good idea of [color theory](https://www.designmantic.com/blog/wp-content/uploads/2014/05/Color-Theory-Infographic.jpg) and what colors go well together depending on how many colors you would like in your pallet.

Some nice sites to play around with color:
- [https://canva.com/colors](https://canva.com/colors)
    - Allows you to upload an image and genearte a color palet from it.
- [https://www.design-seeds.com](https://www.design-seeds.com/)


#### QR Code

[This was a great site](https://www.qrcode-monkey.com/) to create a custom QR code as it provides a lot of options for customization. We placed these business cards and it adds a unique touch.

<img alt='olgas therapy qr code' width='250px' src='/assets/posts/2021-12-15-My-First-Wordpress-Site-Olgas-Therapy/2021-12-15-09-16-00.png'>


### SEO + Structured Data
**Google Search**
- [Google Search Dashboard](https://search.google.com/search-console)

**Lookup Keywords**
- [https://neilpatel.com/ubersuggest](https://neilpatel.com/ubersuggest/)
- [https://www.semrush.com/projects](https://www.semrush.com/projects/)

**Check SEO of site**
- [https://www.seobility.net/en/seocheck](https://www.seobility.net/en/seocheck/)
- [https://seositecheckup.com](https://seositecheckup.com/)

**Google Structured Data Tools**
- [https://developers.google.com/search/docs/advanced/structured-data](https://developers.google.com/search/docs/advanced/structured-data)

### Website Speed Analytics

- [https://pagespeed.web.dev](https://pagespeed.web.dev/)
- [https://gtmetrix.com](https://gtmetrix.com/)
- [https://tools.pingdom.com](https://tools.pingdom.com/)

**Social Media**

You can check what your site looks like when shared on social media with tools like:
- [twitter tester](https://cards-dev.twitter.com/validator)
- [facebook tester](https://developers.facebook.com/tools/debug/)
- [https://socialsharepreview.com/](https://socialsharepreview.com/)

You can look for other platforms such as Pintrist/LinkedIn/etc. with a simple google search.

### Google My Business

It's a good idea for a new business to register their business with Google to show up on Google Maps. This can be done [here](https://www.google.com/business/).


### Looking at other sites for inspiration

Sometimes it helps to look at sites you like and inspect how they are made. You can open the page source in your browser's developer tools to look for fonts/colors and use tools like [builtwith](https://builtwith.com/) or an extension like [Wappalyzer](https://www.wappalyzer.com/) for further details on technology used on the site.


### Branded Email

Since I chose Bluehost as a provider and they have a mail server available. I first configured DNS so we could connect to our mail server and send/receive mail. However, in the end we decided to spend a few dollars a month on [Gmail](https://workspace.google.com/products/gmail/) since they are HIPAA compliant and have a [Business Associate Agreement (BAA)](https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html). See more on Google's HIPAA compliance [here](https://support.google.com/a/answer/3407054). 

I will add the the HIPAA compliant email through Gmail is about $6/mo, although you may be able to use protonmail for free or at a lesser cost. Since my wife has been used to Gmail/GSuite through her past work, we figure this would be nice to reduce the already steep learning curve of starting a new business.

If configuring your own email server, you should be aware of DMARC/DKIM/SPF and the difference between IMAP and POP3.

#### DMARC/DKIM/SPF

If you do end up configuring your own email server, you will have to configure [DMARC](https://en.wikipedia.org/wiki/DMARC), [DKIM](https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail) and [SPF](https://en.wikipedia.org/wiki/Sender_Policy_Framework) for security. Most providers I have seen make it pretty easy to do this and walk you though the steps of configuring your DNS server.


#### IMAP vs. POP3

Finding an email client that supports [IMAP](https://en.wikipedia.org/wiki/Internet_Message_Access_Protocol) as opposed to [POP](https://en.wikipedia.org/wiki/Post_Office_Protocol) is important if you plan to access your emails on several devices (such as your phone and computer). POP3 is usually used if only accessing email on one device and can end up duplicating emails in your inbox if used on multiple multiple devices. I won't get into detail about how all this works, just note that it is important if you decide to choose to host your own mail server as you will need to find a way to connect to it.

> Gmail does not support IMAP and the Outlook web app does not either. The Outlook client app can be used, as well as other client apps found with a simple google search.


## Make The Site Yours! 

**Site Requirements - SEO + Design + Best Practices**

There is a lot of science behind SEO and design. Making sure your site is easy to use, accessable to people with disabilities, and basic psychology to increase "conversions" in getting more clients/customers. Since we are not running a group practice and cannot take an infinite amount of clients, we are not concerned with 100% SEO optimization and there are some design choices that I think I would have done differently if the goal was to get as many clients as possible. For instance, the color scheme is nice, although some background/text colors may not be high enough contrast for ease of reading. The cursive font is slightly illegable at times, there are more opportunities to display call to action buttons to urge visitors to connect, and we could possibly pay some more attention to SEO. The point is that some sites/businesses may be more inclined to do this and get as many clients/customers as possible. Our goal with this site was to let my wife's personality shine through and above some of these "best practices" while still trying to make the site functional and easy to use. My wife's schedule has been filling fast, so there is no use trying to convert clients she cannot take. In the end, treat "best practices" with a grain of salt and evaluate what you actually need - they may not always be best for you.


## Conclusion

In the end, I spent $132.75 dollars for the first year of running this site: 
- $33 ($2.75/mo) on shared hosting through Bluehost
- $44.25 on astra for 1 year and plan to upgrade to a lifetime license for about $190.
- $44.10 on wp rocket
    - I haven't decided if I want to add yearly support/updates for this. We may pay $44 per year, or skip years as the plugin will continue to work while not subscribed.
- $11.40 on jetblog
    - I do not plan on subscribing to updates for this plugin.

I figure this is reasable and reduced the burden on myself to create everything from scratch. That said, it was a lot of work to reserach some of the ins and outs of Wordpress. The site is very performant and loads in less than a second when cached, has a solid SEO backbone, a nice backup strategy, and some basic security trying to prevent brute force attacks. Hopefully my experience here will be helpful to someone else that is new to Wordpress.