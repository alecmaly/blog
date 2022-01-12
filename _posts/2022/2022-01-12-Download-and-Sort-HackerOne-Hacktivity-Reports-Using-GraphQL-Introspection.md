---
layout: post
title: Download and Sort HackerOne Hacktivity Reports Using GraphQL Introspection
description: >-
    HackerOne hacktivity reports can have very useful (and interesting) content for learning how to test real systems for vulnerabilities. Unfortunately, it's impossible to sort on interesting fields such as severity and bounty from within the Hacktivity web UI. The goal of this post is to demonstrate a means of filtering/sorting HackerOne reports in an attempt to find writeups with valuable techniques/methodologies/strategies or other interesting information.
tags: GraphQL HackerOne BugBounty Pentesting 
toc: true
published: true
---

## Introduction

[HackerOne Hacktivity Reports](https://hackerone.com/hacktivity) can be a great resource to view publically disclosed hacks that worked in the real world against real companies and government entities. Unfortunately, sorting and filtering this data through the UI is rather impossible. HackerOne gives the ability to sort only on "Popular" vs. "New" or search in a searchbox. 

![hackerone hacktivity](/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/2022-01-12-14-54-18.png)

However, it would be nice to sort on the severity or bounty amount as you would imagine some of the most impactful hacks will result in large bounties, and these may be more interesting to read. 

In this short post, I will share some of my findings when poking at HackerOne's `/graphql` endpoint and provide some data in .csv format that can be easily searched/sorted/filtered using the tool of your choice. This is not a full in-depth tutorial, but rather a high level overview of my process.

Additionally, I should mention that you should be following [Bug Bounty Reports Explained's YouTube channel](https://www.youtube.com/channel/UCZDyl7G-Lq-EMVO8PfDFp9g) if you aren't already - his content is fantastic!

I will also mention I found [this resource](https://www.howtographql.com/graphql-js/8-filtering-pagination-and-sorting/) to be quite helpful in understanding sort/filter syntax for GraphQL.

## GraphQL 

HackerOne Hacktivity data is collected through the `/graphql` endpoint. Information on GraphQL can be found [here](https://www.howtographql.com/). For our purposes, it's important to note that GraphQL is used to pull back specific fields of data. This can help improve security and performance on an application. Due to its targeted nature of pulling back data, I cannot submit a request such as `Select * FROM _table` to pull back all fields - GraphQL has no mechanism for selecting all possible columns from a table (that I'm aware of), as this would be contradictory to the whole purpose of using GraphQL. Thus, we must introspect the endpoint to determine what fields are available, and formulate a query to return exactly the data we are looking for.

### Introspection (Dumping Schema)

The first step against a `/graphql` endpoint is to run some introspection queries to get an idea of the data schema. Several tools can be used for this such as [clairvoyance](https://github.com/nikitastupin/clairvoyance) and [GraphQLMap](https://github.com/swisskyrepo/GraphQLmap), however, I found these failed for me. The BurpSuite extension [inql](https://github.com/doyensec/inql) seemed to work best in this case. 

Using the inql extension I was able to dump the schema: 
<a href='/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/doc-2022-01-11-1641959947.html' target="_blank">HackerOne GraphQL Schema</a>

Even with the schema in hand, I found building queries through the inql extension's interface to be the easiest for exploring the api.

### Querying /graphql Endpoint

Now that I have the schema and can work through building a query for the endpoint. 
This is the query I have built. The following query will pull the top 5 Disclosed reports on HackerOne and display fields that I found relevant. This can be used by sending a POST request to hackerone. 

![burp suite hackerone graphql query](/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/2022-01-12-14-51-53.png)

```
query {
  hacktivity_items(
    first: 5 # return first X results
    after: "" # after cursor
    where: {
      report: {
            # id: { _eq: 1087489 },                           # filter for specific report
            # hacker_published: { _eq: true },                # show only externally published reports
            disclosed_at: { _is_null: false }                   # show only disclosed reports
      }
    }
    order_by: { field: popular, direction: DESC } # sort by most popular
  ) {
    total_count
    pageInfo {
        hasNextPage
    }
    edges {
        cursor
    }
    nodes {
        ... on HackerPublished {
            __typename
            HackerPublished: report {
                _id
                title
            summaries {
                content
            }
            severity {
                rating
                score
            }
            bounties {
                total_awarded_amount
            }
            disclosed_at
            }
            votes {
                total_count
            }
            team {
                handle
                reports_received_last_90_days
            }
      }
      ... on Disclosed {
        __typename
        currency
        Disclosed: report {
            _id
            title
            summaries {
                content
            }
            severity {
                rating
                score
            }
            bounties {
                total_awarded_amount
            }
            team {
                handle
                reports_received_last_90_days
            }
            disclosed_at
        }
        votes {
            total_count
        }
      }
    }
  }
}
```


Notice I do have a few filters commented out:
```text
where: {
    report: {
        # id: { _eq: 1087489 },                           # filter for specific report
        # hacker_published: { _eq: true },                # show only externally published reports
        disclosed_at: { _is_null: false }                   # show only disclosed reports
    }
}
```

Remove a `#` to uncomment. In this case, I left some examples to show all Published reports as well as filter for a specific report ID if you feel like experimenting. I couldn't get the `_or` filter to work, so make sure to have only one line uncommented at a time, unless you modify the query futher.

### Dumping data to .csv.

I've written a quick and dirty PowerShell script to dump this data to a .csv so I can sort/filter in Excel: 
<a href='https://github.com/alecmaly/blog/blob/gh-pages/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/dump_hackerone_reports.ps1' target="_blank">dump_hackerone_reports.ps1</a>

It downloads HackerOne reports and drops a .csv file to the Downloads directory.

Output: 
<a href='/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/hacktivity_data_disclosed_20220112.csv'>hacktivity_data_disclosed_20220112.csv</a>

<p class='codeblock'>Fields in the output</p>
![hackerone hacktivity reports](/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/2022-01-12-15-42-20.png)

Note that I did not include a summary in the output. This can be done by modifying the query to return:
```text
summaries {
    content
}
```
I chose to omit this value because my output was a .csv and there is a maximum field size in Excel. However, This content may be useful for you if you want to put it in a local database or otherwise perform a full-text search on the report summary. 


## Conclusion

In summary, this has been a fun experiment with GraphQL Introspection. I hope this output allows you to easily find some juicy HackerOne reports.

###  Resources

The same data that was linked above, just consolidated here for easy access.

**Raw Data**

Here is the useful output for finding reports:
- <a href='/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/hacktivity_data_disclosed_20220112.csv'>Disclosed HackerOne Reports.csv</a>
    - Use this file to find interesting HackerOne reports!
- <a href='https://hackerone.com/hacktivity?querystring=&filter=type:hacker-published&order_direction=DESC&order_field=popular' target="_blank">Published HackerOne Reports</a>
    - There are only 33 Published reports (reports published off the HackerOne platform), so it is easy enough to look at them through the GUI.

**Developer/Experimentation Resources**

Useful if you want to test querying the endpoint and dumping the data.
- <a href='/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/doc-2022-01-11-1641959947.html' target="_blank">HackerOne GraphQL Schema</a>
    - A schema to undestand the GraphQL endpoint. In the event you play with pulling your own data and want to find other fields that are relavent to you.
- <a href='https://github.com/alecmaly/blog/blob/gh-pages/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/dump_hackerone_reports.ps1' target="_blank">dump_hackerone_reports.ps1</a>
    - The script I used to dump data to .csv