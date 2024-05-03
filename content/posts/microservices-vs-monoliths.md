---
title: "Microservices vs monoliths"
date: 2024-05-03T01:09:30+01:00
draft: false
---

Which architecture should I choose?

I don't think this is the right question to ask. A better question would be, given the current state of my service/product, which architecture will provide what I'm looking for? For example, performance, independent deployments, application boundaries, etc.

For example, many people mention that we should start with a monolith and while I agree with some of the arguments (simplified development and deployment, consistent performance), it tends to ignore the fact that it might be better to prioritize freedom and experimentation at early stages rather than performance.

Also, sometimes the initial product/service doesn't match the market needs so having this extra freedom to experiment and pivot is really valuable.

Once you have gained enough domain knowledge about the product/service, it is worthwhile to explore moving the architecture to a monolithic one to focus on performance, deployments, etc.

Then, once things start to "scale", you can decouple again the components that will benefit from different development and operational lifecycles.

In short:

1. Start with a microservice to experiment, gain domain knowledge, and pivot if you need to.
2. Move towards a monolith where you can focus on performance.
3. Decouple into microservices what makes sense for your product/service.
