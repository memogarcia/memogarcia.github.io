---
title: "Multi stage docker build for python"
date: 2023-01-01T05:53:23+09:00
draft: false
---

Docker [multi-stage build](https://docs.docker.com/build/building/multi-stage/) is a great way to build a docker image with a minimal footprint.

Compiled languages like GoLang or Rust can take advantage of this by just copying a binary into the "deployment container"

This is an example from the official docs:

```Dockerfile
FROM golang:1.16
WORKDIR /go/src/github.com/alexellis/href-counter/
RUN go get -d -v golang.org/x/net/html
COPY app.go ./
RUN CGO_ENABLED=0 go build -a -installsuffix cgo -o app .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=0 /go/src/github.com/alexellis/href-counter/app ./
CMD ["./app"]
```

When it comes to python, most of the benefits seems to get lost. For example, is quite cumbersome to generate a binary from python code that can be shipped as-is.

But this won't stop me.

We can use a `virtualenv` in the same way we would use a binary from another language.

Here is an example:

```Dockerfile
FROM python:3.11 as build-image
WORKDIR /workspaces/modern-dev/
RUN pip install poetry && poetry config virtualenvs.in-project true
COPY poetry.lock pyproject.toml /workspaces/modern-dev/
RUN poetry install


FROM python:3.11-alpine as release-image
WORKDIR /workspaces/modern-dev/src
COPY --from=build-image /workspaces/modern-dev/ /workspaces/modern-dev/
EXPOSE 80
COPY src/* /workspaces/modern-dev/src/
ENV PATH="/workspaces/modern-dev/.venv/bin:$PATH"
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "80"]
```

This image uses `103MB` (with current poetry dependencies)

Here is the simpler example:

```Dockerfile
FROM python:3.11
WORKDIR /workspaces/modern-dev/
RUN pip install poetry && poetry config virtualenvs.in-project true
COPY poetry.lock pyproject.toml /workspaces/modern-dev/
RUN poetry install
WORKDIR /workspaces/modern-dev/src
EXPOSE 80
COPY src/* /workspaces/modern-dev/src/
ENV PATH="/workspaces/modern-dev/.venv/bin:$PATH"
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "80"]
```

With this simpler Dockerfile, the image size would be: `1.04GB`, that's **10 times bigger**