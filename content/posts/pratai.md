---
title: "Pratai, event driven platform for OpenStack"
date: 2018-01-05T19:08:55+01:00
draft: false
---

**Note** This is a Work-In-Progress Document.

Read the docs at [memogarcia/pratai-docs](https://github.com/memogarcia/pratai-docs)

## Abstract

Pratai provides an incredibly flexible and resilient platform to migrate
workloads to the cloud that respond to events without having to manage any
server or network.

## How it works

The goal of Pratai is simple. Deploy "code" (disclaimer, from now on I
will refer to code as functions), that will react to an event without
worrying about anything else, the platform handles the execution. Simple right?

In order to achieve that, first, we need to deploy a function in a `zip` format
for one of the languages that the platform supports,
the first one is python but more will be added in the future, after this a
docker image gets created with the custom
function and the requirements. e.g.

```python
# new_module.py
import numpy  # yes you can install dependencies, just send a requirements.txt


def local_function(payload):
    # you can create local functions
    return payload


def main(payload=None):
    # a main function should always be declared
    # and using a payload as a parameter
    return local_function(payload)
```

When a function gets created it will remain as inactive, waiting to be executed
whenever an event happens that the function is subscribed to, could be a webhook
endpoint, which can be assigned at creation time, or a message in a queue but
basically, every event will spawn a container that will execute the event and
then disappear.

## Architecture

Pratai is conformed of 2 major pieces, the Control Plane and the Nodes.

### Control Plane

An API gateway, a database cluster and a load balancer, and agent and a scheduler
runs in the control plane.

For the first version a API gateway built in python using flask will be made,
in the future I think Golang should be a better option for it.

An elasticsearch cluster will power the storage of events, function metadata
and cluster information.

And a nginx load balancer will connect 3 instances to the API in a `least_connect`
manner.

### Pratai Nodes

A Pratai node is composed by a driver and runtimes.

When a new node is created it will automatically connect to the cluster and it
will start polling for events.

A driver is basically a container orchestrator like swarm, kubernetes, plain
docker, etc. in this case we will use docker.

The runtimes are the languages supported by the platform, they are a base
container image that contains an OS, a language and its dependencies, etc. that
can be used by the functions the users submits. e.g.

```bash
# seed/Dockerfile
FROM ubuntu:14.04
RUN apt-get -y update
RUN apt-get install -y git unzip wget
```

```bash
# python27/Dockerfile

FROM pratai/seed:latest

RUN apt-get install -y python python-dev python-setuptools python-pip
RUN pip install pip --upgrade
```

```bash
# python27_template.txt
FROM pratai/python27:latest
RUN wget {zip_location}
RUN unzip {zip_file}
RUN pip install -r requirements.txt
RUN mkdir /etc/pratai/
RUN mkdir /var/log/pratai/
RUN cp new_module.py /etc/pratai/
RUN git clone "repo_with_runtimes"
CMD ["python", "/pratai-runtimes/runtimes/python27/server.py"]
```

## Distributed Queues

ZeroMQ is the choice for queuing and passing messages in pratai using the PUSH/PULL
architecture we can create a pipelines of messages that can be distributed
across multiple nodes.

We will have a producer and a collector running in the scheduler, and consumers
running in the Pratai nodes, one consumer should be spawned per thread.

## Events

A function can react to any event coming through webhooks or messages
in a queue, even events that happen in a database can trigger a function, is
important to notice that a response of a function is an event, so it can trigger
so chaining functions to build pipelines of data processing is easy with Pratai.

There are 2 kinds of events, `async` and `wait_for_response`

### Async

This is the default event for pratai, it will take a request or a message and
process it asynchronously, then, you can collect the logs or responses,
by default the response gets stored in a collector queue, that can send this
response as an input for other functions.

You can use the async event in the following cases:

1: Async + Webhook

This is the default behaviour, in which a function will be executed
asynchronously when an HTTP POST requests hits its endpoint.

```bash
pratai function-create {name} --type async --event webhook
```

2: Async + Message

A function created with this configuration will executed asynchronously when a
message arrives in the event queues available for the platform.

```bash
pratai function-create {name} --type async --event message --subscribe_to {event_id}
```

3: Async + Timer

A function created with this configuration will executed asynchronously
every time a timer sends an event, the frequency of the events are set in minutes.

```bash
pratai function-create {name} --type async --event timer --frequency 5
```

### Wait For Response

This is a request that works like a typical web server, you send a request and
you wait for a response and only works for webhooks events

```bash
pratai function-create {name} --type wait_for_response --event webhook
```

## Components

### API Gateway

The API is the main interface for incoming webhook requests and for platform
configuration.

### Agent

The Agent is the main interface for events in queues and cron jobs.

### client

python-prataiclient is the component that allows the user to interact with the
api from the command line interface, with it you can do stuff like this:

```bash
pratai function-create music_tag --file /path/to/zip --description \
    "extract metadata from music files" --memory 128

pratai function-list
```

Because this is OpenStack you should pass credentials to interact with the
platform

```bash
export OS_USERNAME=user
export OS_PASSWORD=password
export OS_TENANT_NAME=pratai_tenant
export OS_PRATAI_URL=http://192.168.33.9:9096
export OS_IDENTITY_API_VERSION=3
export OS_AUTH_URL=http://192.168.33.9:5000/v3
export OS_PROJECT_NAME=pratai_tenant
export OS_PROJECT_DOMAIN_NAME=Default
export OS_USER_DOMAIN_NAME=Default
```

## Drivers

A driver is a backend that orchestrate a container that contains the custom code.

## Runtimes

A runtime is a language that is supported by the platform, it contains the
language and its dependencies.

## Scheduler

The scheduler primarily consists of a set of Python daemons, though it requires
and integrates with a number of native system components for databases and
messaging capabilities.

1; Scheduler

The API and the Agent push messages to this queue which will be pre-processed
before being distributed among the pratai nodes.

2; Collector

When a function finish the function execution it will send the result and
status here in order to be stored in the database afterwards.

## Security & Secrets

The functions that interact with external services most often that not they
require to use credentials to connect, for this, Barbican has been proposed to
help with this scenario.

We definitely recommend using tokens instead of user/passwords when possible.

## Community

Join us at `#pratai` irc channel in `freenode`

## Repositories

- [memogarcia/pratai-docs](https://github.com/memogarcia/pratai-docs)
- [memogarcia/pratai-agent](https://github.com/memogarcia/pratai-agent)
- [memogarcia/pratai-api](https://github.com/memogarcia/pratai-api)
- [memogarcia/pratai-scheduler](https://github.com/memogarcia/pratai-scheduler)
- [memogarcia/pratai-runtimes](https://github.com/memogarcia/pratai-runtimes)
- [memogarcia/pratai-drivers](https://github.com/memogarcia/pratai-drivers)

### References

- [The Reactive Manifesto](http://www.reactivemanifesto.org)
- [Cloud Design Patterns](https://msdn.microsoft.com/en-us/library/dn600223.aspx)