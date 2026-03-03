---
title: "Chapter 3: Multi-Region Cloud Training - Istio Multi-Region Mesh"
date: 2025-10-17T09:12:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-03-istio/
---

Now that we can deploy to multiple clusters, we need them to talk to each other. If a service in the US needs to reach a service in the EU, how does that traffic route? How do we secure it? 

We could expose everything to the public internet via Ingress, but that's a massive security risk for internal API traffic. Instead, we'll use Istio to build a multi-primary, multi-network service mesh. This gives us secure, transparent east-west traffic routing across our regions.

### The Architecture: East-West Gateways

Because our two clusters run on different underlying networks (they don't share a flat IP space), pod A in the US cannot directly ping pod B in the EU. 

To bridge this gap, Istio uses an "East-West Gateway." This is a dedicated load balancer in each cluster that acts as a secure transit point. Traffic leaving the US cluster goes to the EU's East-West Gateway, which then routes it to the correct pod inside the EU network. Crucially, Istio maintains mutual TLS (mTLS) across this entire hop, so the traffic is fully encrypted in transit.

```text
  Cross-cluster routing via East-West Gateways

   +-----------+     mTLS over public internet     +-----------+
   | Cluster US|<=================================>| Cluster EU|
   | istiod    |                                   | istiod    |
   | east-west | <-------------15443-------------  | east-west |
   | gateway   |                                   | gateway   |
   | echo svc  |                                   | echo svc  |
   +-----------+                                   +-----------+
```

To make this work, both clusters need to share the same `meshID` and `trustDomain` (so they trust each other's certificates), but they must have distinct `network` names so Istio knows when traffic needs to traverse the gateway.

### Installation via Helm

We'll install Istio using Helm. Notice how we enable `PILOT_ENABLE_MULTINETWORK` and set distinct networks (`us-net` and `eu-net`) for each region.

```yaml
# values-istio.yaml
global:
  meshID: training-mesh
  trustDomain: corp.local
  # We will override this network value per cluster during install
  network: us-net 
pilot:
  env:
    PILOT_ENABLE_MULTINETWORK: "true"
```

Let's apply this to both clusters:

```bash
# US cluster (network: us-net)
helm upgrade --install istio-base istio/base -n istio-system --create-namespace
helm upgrade --install istiod istio/istiod -n istio-system -f values-istio.yaml --set global.network=us-net --wait

# EU cluster (network: eu-net)
helm upgrade --install istio-base istio/base -n istio-system --create-namespace --kube-context prod-eu-west-1
helm upgrade --install istiod istio/istiod -n istio-system -f values-istio.yaml --kube-context prod-eu-west-1 --set global.network=eu-net --wait
```

### Exposing the Gateways

Next, we need to spin up the actual East-West Gateways. We use an `IstioOperator` manifest for this, which tells Istio to create a LoadBalancer specifically for internal mesh traffic.

```yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: eastwest-gw
  namespace: istio-system
spec:
  profile: empty
  components:
    ingressGateways:
      - name: istio-eastwestgateway
        enabled: true
        label: { istio: eastwestgateway }
        k8s:
          service: { type: LoadBalancer }
```

### Routing Traffic (The Hard Way)

Normally, people use the `istioctl` command-line tool to magically wire up cross-cluster secrets. But we are engineers, and we want to understand how it actually works under the hood. 

Instead of magic, we'll explicitly define a `ServiceEntry`. This tells the US cluster: "Hey, if someone asks for `echo.eu.mesh.local`, send that traffic out to the EU's East-West Gateway IP address on port 15443."

```yaml
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: echo-eu-through-gateway
  namespace: echo
spec:
  hosts:
    - echo.eu.mesh.local
  addresses:
    - 240.0.0.2/32 # A dummy VIP for routing
  ports:
    - number: 80
      name: http
      protocol: HTTP
  resolution: DNS
  location: MESH_EXTERNAL
  endpoints:
    # Replace this with your actual EU cluster's LoadBalancer IP/DNS
    - address: <EU_EASTWEST_LB_DNS>
      ports: { http: 15443 }
      locality: eu
```

### Verification

Once applied, you can jump into a pod in the US cluster and run:
`curl http://echo.eu.mesh.local`

You should get a response back from the EU region. 

You've just built a secure, multi-region transit network. By default, Istio's locality load balancing will always prefer the local cluster, keeping latency low. But if a local service fails, or if you explicitly route across the mesh like we just did, the East-West gateways handle the heavy lifting seamlessly.

[Previous: Part 2](/posts/multi-region-series-part-2-argocd/) · [Continue to Part 4: AWS Identity](/posts/multi-region-series-part-4-identity/)
