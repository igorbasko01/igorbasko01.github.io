---
  layout: post
  title: "go/links Webserver Initial Implementation"
  categories: python webserver fastapi golinks
  created: 2022-02-08
  date: 2022-02-09 00:00:00 +0200
  published: true
---
_This is the second part of my project of implementing a go/links system.
You can find the first post in the series [here]({% post_url 2022-02-04-golinks-clone-design %})._ 
## Overview
My overall plan in implementing the go/links solution was to validate that 
I'm able to route requests to the webserver from the browser and that it
would redirect my request to some website, and I will get the result in 
the browser.

I wanted to make that validation as fast as possible, so I wanted to start
with the most basic and simple webserver that I can build. For that I went
with [FastApi](https://fastapi.tiangolo.com/), and created a very basic 
webserver.

## Some TDD
Lately I've started using the TDD (Test Driven Development) process more
often. As I saw that it helps me to design pretty good applications, and
also add some tests that would allow to refactor the code later with a 
peace of mind, as I already had tests to cover the areas that I change
and still be somewhat sure that the behavior is correct.

I've created a project library, added there the following `requirements.txt`:
```
fastapi==0.72
uvicorn[standard]==0.17
requests==2.27.1
pytest==6.2.5
```
Created a virtual environment and installed the requirements there.

From there I've started with the tests, instead of starting with the 
implementation of the webserver.

I've created two tests that would describe the behavior that I wanted
from my basic webserver at this stage of the project. The tests were:
```python
def test_get_link_not_found():
    ...

def test_get_links_no_links():
    ...
```

In the first test, I test what should happen if a link was requested but
it wasn't found.

And in the second test I make sure that a GET ALL links request returns 
an empty list of links.

These behaviors are good enough behaviors to see that the webserver sends
some responses.

Filling those tests using the [FastAPI test example](https://fastapi.tiangolo.com/tutorial/testing/#using-testclient) 
was pretty easy. The whole file eventually looked like this:
```python
from fastapi.testclient import TestClient
from golinks.main import app

client = TestClient(app)


def test_get_link_not_found():
    response = client.get('/links/non_existent_link')
    assert response.status_code == 404
    assert response.json() == {'detail': 'Link non_existent_link not found'}


def test_get_links_no_links():
    response = client.get('/links')
    assert response.status_code == 200
    assert response.json() == {'links': []}
```
At this point of course the tests couldn't run, as we didn't have some of the 
components specifically the `app`.
But we already had some tests, and we knew what was missing, so we can now
create our webserver (the `app`).

Creating a FastAPI app is a breeze, we just need to instantiate it, like so:
```python
from fastapi import FastAPI

app = FastAPI()
```

And now we just need to add the endpoints that we need, such as endpoints for:
1. Fetching all the links
2. Fetching specific information about a link

The whole code for the webserver for now is as follows:
```python
from fastapi import FastAPI, HTTPException

app = FastAPI()


@app.get('/links')
def get_all_links():
    return {'links': []}


@app.get('/links/{link_id}')
def get_link(link_id: str):
    raise HTTPException(status_code=404, detail=f'Link {link_id} not found')
```
We can see that we allow two endpoints a `/links/` and a `/links/{link_id}`.
The first one is without a parameter and we expect it to return all the links
that we have stored in the database, but for now we have nothing, as we don't 
even have a database, so it just returns an empty list of links.

The second one is the one that should just return information about the link.
But because we still haven't implemented any storage for that and we for sure
have no links to return, it just raises a not found HTTP status code.

Now we can run our tests and see if they work as expected using `pytest` like
that:
```shell
PYTHONPATH=. pytest
```

And we can even run the webserver and query it by running: 
```shell
uvicorn golinks.main:app
```
By default, it should bind the webserver to port 8000, so sending requests
to it should return the expected results. For example:
```shell
curl -v http://127.0.0.1:8000/links/some_link

...
< HTTP/1.1 404 Not Found
...
{"detail":"Link some_link not found"}
```
Or if trying the `/links` endpoint:
```shell
curl http://127.0.0.1:8000/links
 
{"links":[]}
```

## Next Steps
For now this functionality is enough, for the next time, I would like to
check if using the browser with the a `go/` domain works, and does it pass
requests to the webserver.

Thanks for reading and see you next time.