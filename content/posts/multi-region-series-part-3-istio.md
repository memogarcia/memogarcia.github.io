---
title: "Multi-Region Cloud Training, Part 3: Istio Multi-Region Mesh"
date: 2025-10-17T09:12:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-03-istio/
---

Because our two clusters sit on separate networks without a flat pod IP space, a pod in US cannot reach a pod IP in EU directly. To route internal traffic between clusters without exposing application services on public Ingress, we install Istio in both clusters with east-west gateways and wire cross-cluster calls over mTLS on port `15443`.

```text
  Cross-cluster routing via east-west gateways

   +-----------+     mTLS (port 15443)             +-----------+
   | Cluster US|<=================================>| Cluster EU|
   | istiod    |                                   | istiod    |
   | east-west |  ServiceEntry + DestinationRule   | east-west |
   | gateway   |  ------------------------------>  | gateway   |
   | echo svc  |                                   | echo svc  |
   +-----------+                                   +-----------+
```

## Shared Trust Prerequisite

Both clusters must share the same `meshID` and `trustDomain`, **and** they must share a common root CA. By default, each cluster's `istiod` generates its own self-signed root certificate, so cross-cluster mTLS handshakes fail even when `meshID` and `trustDomain` match.

Before installing `istiod`, create the `istio-system` namespace in both clusters and load intermediate certificates signed by the same root CA into a `cacerts` secret (`ca-cert.pem`, `ca-key.pem`, `root-cert.pem`, `cert-chain.pem`) following the [Istio plug-in CA documentation](https://istio.io/latest/docs/tasks/security/cert-management/plugin-ca-cert/).

## Installing Istio via Helm

Save shared control-plane values in `deploy/istio/values-istio.yaml`. Enabling Istio's DNS proxy (`ISTIO_META_DNS_CAPTURE` and `ISTIO_META_DNS_AUTO_ALLOCATE`) lets sidecars resolve synthetic hostnames defined in `ServiceEntry` resources (such as `echo.eu.mesh.local`) without touching CoreDNS.

```yaml
# deploy/istio/values-istio.yaml
global:
  meshID: training-mesh
  trustDomain: corp.local
meshConfig:
  defaultConfig:
    proxyMetadata:
      ISTIO_META_DNS_CAPTURE: "true"
      ISTIO_META_DNS_AUTO_ALLOCATE: "true"
```

Add the Istio Helm repository, label each `istio-system` namespace with its network name, and install `istio-base` and `istiod` in both clusters (or run `task istio:install:all` from the repo `Taskfile.yml`):

```bash
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# US cluster (network: us-net)
kubectl --context prod-us-east-1 create ns istio-system --dry-run=client -o yaml | kubectl --context prod-us-east-1 apply -f -
kubectl --context prod-us-east-1 label ns istio-system topology.istio.io/network=us-net --overwrite
helm --kube-context prod-us-east-1 upgrade --install istio-base istio/base -n istio-system
helm --kube-context prod-us-east-1 upgrade --install istiod istio/istiod -n istio-system \
  -f deploy/istio/values-istio.yaml \
  --set global.multiCluster.clusterName=prod-us \
  --set global.network=us-net \
  --wait

# EU cluster (network: eu-net)
kubectl --context prod-eu-west-1 create ns istio-system --dry-run=client -o yaml | kubectl --context prod-eu-west-1 apply -f -
kubectl --context prod-eu-west-1 label ns istio-system topology.istio.io/network=eu-net --overwrite
helm --kube-context prod-eu-west-1 upgrade --install istio-base istio/base -n istio-system
helm --kube-context prod-eu-west-1 upgrade --install istiod istio/istiod -n istio-system \
  -f deploy/istio/values-istio.yaml \
  --set global.multiCluster.clusterName=prod-eu \
  --set global.network=eu-net \
  --wait
```

Enable sidecar injection on the `echo` namespace in both clusters so the pods we deploy in Part 5 join the mesh:

```bash
for ctx in prod-us-east-1 prod-eu-west-1; do
  kubectl --context "$ctx" create ns echo --dry-run=client -o yaml | kubectl --context "$ctx" apply -f -
  kubectl --context "$ctx" label ns echo istio-injection=enabled --overwrite
done
```

## Installing East-West Gateways

Install the east-west gateway in each cluster with the `istio/gateway` Helm chart. Passing `--set networkGateway=<net>` tells the chart to expose Istio's multi-network ports (`15443`, `15021`, `15012`, `15017`) instead of the default ingress ports (`80`, `443`).

```yaml
# deploy/istio/gateway-eastwest-values.yaml
labels:
  istio: eastwestgateway
service:
  type: LoadBalancer
```

```bash
helm --kube-context prod-us-east-1 upgrade --install istio-eastwestgateway istio/gateway \
  -n istio-system \
  -f deploy/istio/gateway-eastwest-values.yaml \
  --set networkGateway=us-net \
  --wait

helm --kube-context prod-eu-west-1 upgrade --install istio-eastwestgateway istio/gateway \
  -n istio-system \
  -f deploy/istio/gateway-eastwest-values.yaml \
  --set networkGateway=eu-net \
  --wait
```

You can also run both installs with `task istio:gw:all`.

## Explicit Cross-Cluster Routing (Without `istioctl`)

Instead of exchanging cluster credentials with `istioctl create-remote-secret`, we wire the cross-cluster path explicitly with four resources: a `Gateway` and `VirtualService` on the EU cluster, and a `ServiceEntry` and `DestinationRule` on the US cluster.

### EU Cluster: Accept mTLS on Port 15443

Apply this `Gateway` and `VirtualService` to `prod-eu-west-1`. The gateway validates incoming Istio mTLS certificates (signed by the shared root CA) for `echo.eu.mesh.local`, and the `VirtualService` forwards requests to the local `echo` service:

```yaml
# Apply to prod-eu-west-1
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: eastwest-echo
  namespace: istio-system
spec:
  selector:
    istio: eastwestgateway
  servers:
    - port:
        number: 15443
        name: https-eastwest
        protocol: HTTPS
      tls:
        mode: ISTIO_MUTUAL
      hosts:
        - "echo.eu.mesh.local"
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: eastwest-echo
  namespace: echo
spec:
  hosts:
    - "echo.eu.mesh.local"
  gateways:
    - istio-system/eastwest-echo
  http:
    - route:
        - destination:
            # In Part 7.1, update this host to echo-stable.echo.svc.cluster.local
            host: echo.echo.svc.cluster.local
            port:
              number: 80
```

### US Cluster: Route `echo.eu.mesh.local` to the EU Gateway

Look up the EU east-west gateway LoadBalancer hostname (or IP):

```bash
kubectl --context prod-eu-west-1 -n istio-system get svc istio-eastwestgateway
```

Apply the `ServiceEntry` and `DestinationRule` to `prod-us-east-1`. The `ServiceEntry` registers `echo.eu.mesh.local` in US sidecars; the `DestinationRule` forces `ISTIO_MUTUAL` with the matching SNI so traffic leaves the US sidecar encrypted. If your EU LoadBalancer gives an IP address rather than a DNS hostname, change `resolution: DNS` to `resolution: STATIC`.

```yaml
# Apply to prod-us-east-1
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: echo-eu-through-gateway
  namespace: echo
spec:
  hosts:
    - echo.eu.mesh.local
  addresses:
    - 240.0.0.2/32
  ports:
    - number: 80
      name: http
      protocol: HTTP
  resolution: DNS
  location: MESH_EXTERNAL
  endpoints:
    - address: <EU_EASTWEST_LB_DNS>
      ports:
        http: 15443
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: echo-eu-mtls
  namespace: echo
spec:
  host: echo.eu.mesh.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
      sni: echo.eu.mesh.local
```

## Verification

Once the sample `echo` service is running in EU (Part 5), run an ephemeral curl pod inside the US `echo` namespace (which has sidecar injection enabled):

```bash
kubectl --context prod-us-east-1 -n echo run curl --rm -it --restart=Never \
  --image=curlimages/curl -- curl -sS http://echo.eu.mesh.local
```

You should get a response back from EU (`ok region=eu ...`).

## Scope Boundary

This explicit `ServiceEntry` design gives you encrypted, named cross-cluster calls (`echo.eu.mesh.local`) without maintaining cross-cluster kubeconfig secrets. It does **not** give you automatic locality failover when local `echo.echo.svc.cluster.local` pods fail. Automatic cross-cluster failover requires remote endpoint discovery (via `istioctl create-remote-secret`) combined with `outlierDetection` on a `DestinationRule`.

[Previous: Part 2](/posts/multi-region-series-part-2-argocd/) · [Index](/posts/multi-region-learning/) · [Next: Part 4](/posts/multi-region-series-part-4-identity/)
