---
  layout: post
  title: "go/links clone design"
  categories: python database golinks
  created: 2022-02-04
  date: 2022-02-06 00:00:00 +0200
  published: true
---

## Overview
I have an old itch that always was in the back of my mind for years, where I
wanted to understand how databases work under the hood.

Of course there are a lot of different types of databases, and each one 
contains a lot of different components. So it is a lot of ground to cover.
Instead of just reading about them, I also want to implement bits and pieces. 

So I decided that I should start working on some project that I can benefit
from, and also implement some aspects of a database. I thought about starting
with some simple implementation of a key-value store. The project that I think
that will benefit of such a database is a clone of the go/links system.

Basically a go/links system, is a sort of bookmarking application for your browser,
where when you input into the address bar some address that starts with `go/` and 
a keyword, it will redirect the browser to some pre-stored site for that keyword. 
For example it is possible to define that `go/facebook` will take you to `www.facebook.com`,
Or to any specific link that you desire.

## Design
The basic components that I would need for the architecture of the system, are:
1. Webserver
2. Database

The Database will store the key-value items, where the key would be the link keyword, 
for example `facebook`. And the value would be the underlying link, `www.facebook.com` for example.
I will write the database from scratch in Python, as this is really what I want to practice. 
I don't look for great performance but mostly practicing concepts.

Basically it will hold an in memory dictionary, that will be flushed to disk and initialized from
disk. I will use [Protocol Buffers](https://developers.google.com/protocol-buffers){:target="_blank"} 
for the schema of the items that will be stored to disk. It allows serializing the data to a more
compact representation, and also provide schema evolution if changes will occur in the future.

The Webserver will receive the requests of the `go/` type, and redirect to the underlying value
that is stored in the database.
It will also allow creating and updating links.
I will use [FastAPI](https://fastapi.tiangolo.com/){:target="_blank"} framework for the server.

In order to direct `go/` requests to the webserver, I will update the `/etc/hosts` file.

## Next Steps
In my next posts I will take the implementation step by step, and describe how I implement 
each part of the system, so you could try and replicate and even do better.

Thanks for reading, and see you soon.

[Next post]({% post_url 2022-02-08-golinks-webserver-initial-implementation %}) in the series.