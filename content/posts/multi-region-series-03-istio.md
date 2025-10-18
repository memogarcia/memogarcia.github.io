---
title: "Multi region cloud training Lab 3/9: Istio Multi Region Mesh"
date: 2025-10-17T09:12:00-07:00
draft: false
---

Problem: Enable east to west traffic and consistent policy across clusters.

Assumptions/Constraints

- Cost note: Two clusters stand in for two regions.
- Same `meshID`, same trust domain, distinct `network` per cluster.

ASCII Diagram

```
  Cross cluster via gateway + ServiceEntry (no istioctl)

   +-----------+   mTLS mesh   +-----------+
   | Cluster US|<=============>| Cluster EU|
   | istiod    |               | istiod    |
   | east-west | <---15443---- | east-west |
   | gateway   |               | gateway   |
   | echo svc  |               | echo svc  |
   +-----------+               +-----------+

  meshID=training-mesh, trustDomain=corp.local
  networks: us-net, eu-net; locality prefers same cluster
```

Steps

1) Install Istio on each cluster with matching meshID and trustDomain, unique network.
2) Expose an east west gateway in each cluster.
3) Configure cross cluster routing using east west gateways and ServiceEntry. No istioctl.

Example (Helm values excerpt)

```yaml
# values-istio.yaml
global:
  meshID: training-mesh
  trustDomain: corp.local
  network: us-net  # use eu-net in EU cluster
pilot:
  env:
    PILOT_ENABLE_MULTINETWORK: "true"
```

Install

```bash
# US cluster
helm upgrade --install istio-base istio/base -n istio-system --create-namespace
helm upgrade --install istiod istio/istiod -n istio-system -f values-istio.yaml --set global.network=us-net --wait

# EU cluster
helm upgrade --install istio-base istio/base -n istio-system --create-namespace --kube-context prod-eu-west-1
helm upgrade --install istiod istio/istiod -n istio-system -f values-istio.yaml --kube-context prod-eu-west-1 --set global.network=eu-net --wait
```

East west gateway

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

Cross cluster ServiceEntry (call EU from US through EU gateway)

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
    - 240.0.0.2/32
  ports:
    - number: 80
      name: http
      protocol: HTTP
  resolution: DNS
  location: MESH_EXTERNAL
  endpoints:
    - address: <EU_EASTWEST_LB_DNS>
      ports: { http: 15443 }
      locality: eu
```

Verification/DoD

- From US cluster, `curl http://echo.eu.mesh.local` returns `region=eu` through gateway.
- Local traffic continues to prefer local cluster by default.

Observability install (Helm)

```bash
# US cluster
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add kiali https://kiali.org/helm-charts
helm repo update
kubectl --context prod-us-east-1 create ns observability --dry-run=client -o yaml | kubectl --context prod-us-east-1 apply -f -
helm --kube-context prod-us-east-1 upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack -n observability \
  --set grafana.service.type=LoadBalancer --set prometheus.service.type=LoadBalancer --set alertmanager.service.type=LoadBalancer --wait
helm --kube-context prod-us-east-1 upgrade --install kiali kiali/kiali-server -n istio-system --set auth.strategy=anonymous --set service.type=LoadBalancer --wait

# EU cluster (repeat with prod-eu-west-1)
kubectl --context prod-eu-west-1 create ns observability --dry-run=client -o yaml | kubectl --context prod-eu-west-1 apply -f -
helm --kube-context prod-eu-west-1 upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack -n observability \
  --set grafana.service.type=LoadBalancer --set prometheus.service.type=LoadBalancer --set alertmanager.service.type=LoadBalancer --wait
helm --kube-context prod-eu-west-1 upgrade --install kiali kiali/kiali-server -n istio-system --set auth.strategy=anonymous --set service.type=LoadBalancer --wait
```

Previous: [Lab 2](/posts/multi-region-series-02-argocd/) · Next: [Lab 4](/posts/multi-region-series-04-identity/)
