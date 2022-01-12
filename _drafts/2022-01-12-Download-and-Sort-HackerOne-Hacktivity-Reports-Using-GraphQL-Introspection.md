---
layout: post
title: DRAFT | Download and Sort HackerOne Hacktivity Reports Using GraphQL Introspection
description: >-
    HackerOne hacktivity reports can have very useful content when learning how to test real systems for vulnerabilities. The goal of this article is to provide a means of filtering/sorting HackerOne reports in an attempt to find valuable exploits, methodologies, and strategies.
tags: GraphQL HackerOne BugBounty Pentesting 
toc: true
published: true
---

## Introduction

[HackerOne Hacktivity Reports](https://hackerone.com/hacktivity) can be a great resource to view publically disclosed hacks that worked in the real world against some of the largest companies and government organizations. Unforatunately, sorting and filtering this data through the UI is rather impossible. HackerOne gives the ability to sort only on "Popular" vs. "New" or search in a searchbox. 

![hackerone hacktivity](/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/2022-01-12-14-54-18.png)

However, it would be nice to sort on severity or bounty amount as you would imagine some of the most impactful hacks will result in large bounties. 

In this short post, I will share some of my findings when poking at HackerOne's `/graphql` endpoint and provide some data in .csv format that can be easily searched/sorted/filtered using the tool of your choice. 

Additionally, I will mention that you should totally be following [Bug Bounty Reports Explained's YouTube channel](https://www.youtube.com/channel/UCZDyl7G-Lq-EMVO8PfDFp9g) if you aren't already - his content is fantastic!

## GraphQL 

### Introspection (Dumping Schema)

The first step against a /graphql endpoint is to run some introspection queries to get an idea of the data schema. Several tools can be used for this such as [clairvoyance](https://github.com/nikitastupin/clairvoyance) and [GraphQLMap](https://github.com/swisskyrepo/GraphQLmap), however, I found these failed for me. The BurpSuite extension [inql](https://github.com/doyensec/inql) seemed to work best in this case. 

Using the inql extension I was able to dump the schema: 
<a href='/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/doc-2022-01-11-1641959947.html'>HackerOne GraphQL Schema</a>

### Querying /graphql Endpoint

Now that I have the schema and can work through building a query for the endpoint. 
This is the query I have built. The following query will pull the top 5 Disclosed reports on HackerOne and display fields that I found relevent. This can be used by sending a POST request to hackerone. 

![burp suite hackerone graphql query](/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/2022-01-12-14-51-53.png)

```
query {
	hacktivity_items(
    	first: 5											# return first X results
    	after: ""								            # after cursor
    	where:{
        report: {
          # id: { _eq: 1087489 },							# filter for specific report
          # hacker_published: { _eq: true },				# show only externally published reports
          disclosed_at: { _is_null: false }					# show only disclosed reports
        }
      }, 					
  		order_by: { field: popular, direction: DESC }  	    # sort by most popular
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
        HackerPublished:report {
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
        Disclosed:report {
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
    report: {
        # id: { _eq: 1087489 },							# filter for specific report
        # hacker_published: { _eq: true },				# show only externally published reports
        disclosed_at: { _is_null: false }					# show only disclosed reports
    }
```

Remove a `#` to unfilter. In this case, I left some examples to show all Published reports as well as filter for a specific report ID if you feel like experimenting.

### Dumping data to .csv.

I've written a quick and dirty PowerShell script to dump this data to a .csv so I can sort/filter in Excel: 
<a href='/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/dump_hackerone_reports.ps1'>dump_hackerone_reports.ps1</a>

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
I chose to omit this value because my output was a .csv and there is a maximum field size in Excel. However, This content may be useful for you if you want to put it in a local database or otherwise perform a full text search on the report summary. 


## Conclusion

In summary, this has been a fun experiment with GraphQL Intrspection. I hope this output allows you to easily find some juicy HackerOne reports.

## Resources

Again, here is the useful output from this GraphQL Introspection:
- <a href='/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/doc-2022-01-11-1641959947.html'>HackerOne GraphQL Schema</a>
- <a href='/assets/posts/2022-01-12-Download-and-Sort-HackerOne-Hacktivity-Reports-Using-GraphQL-Introspection/hacktivity_data_disclosed_20220112.csv'>Disclosed HackerOne Reports.csv</a>
- [Published HackerOne Reports](https://hackerone.com/hacktivity?querystring=&filter=type:hacker-published&order_direction=DESC&order_field=popular) 
    - There are only 33 Published reports (reports published off the HackerOne platform), so it is easy enough to look at them through the GUI.