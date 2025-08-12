---
title: "Istio Ambient Mesh"
date: 2022-11-24T00:03:30+01:00
draft: false
---

Ambient mesh is a new data plane mode for Istio that doesn’t rely on sidecars.

It gives users the option to forgo sidecar proxies in favor of a mesh data plane that’s integrated into your infrastructure.

Ambient mesh benefits are:
* Minimal configuration for traffic encryption.
* Same configuration for L7 policies as ”normal service mesh”.
* Take less resources because no sidecars are needed.
* Easier upgrades because pods don’t need to restart in order to upgrade the service mesh.
* Sidecars might break workloads (I’m looking at you GitLab…)

It also gives the flexibility to opt-in on features of the service mesh according to your needs.

![ambient-layers](/img/ambient-layers.png)


## New components

### ztunnel

Ztunnel (zero trust tunnel).

Deployed as a daemonset in the form of a pod per node in the cluster, including Kubernetes control-plane nodes.

Istio-CNI uses IPtables Rules to direct traffic into a tunnel (plain text for now).

It handles mTLS different than an Envoy proxy.
An Envoy sidecar does a HTTP TLS upgrade, and it will encrypt every packet.
A ztunnel encrypts every byte stream that enters into it

Future releases could use eBPF to route traffic to the ztunnel instead of using Iptables

### HBONE

HBONE (HTTP Based Overlay Network Environment) protocol to encapsulate traffic inside the ztunnel.

Runs on a dedicated port: `15008`

support metadata - 'baggage' header, source/destination info

### Waypoint proxy

Waypoint proxy, an Envoy proxy that handles layer 7 capabilities, deployed per namespace or per service.


## Installation

### Kubernetes Kind installation

Installing a 1 `control-plane`, 2 `worker` node `kind` kubernetes cluster

```bash
sudo kind create cluster --config=- <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: ambient
nodes:
- role: control-plane
- role: worker
- role: worker
networking:
    apiServerAddress: "192.168.0.198"
    apiServerPort: 6443
EOF
```

Increate the open file limit

```bash
sudo sysctl fs.inotify.max_user_watches=524288
sudo sysctl fs.inotify.max_user_instances=512
```

Set the proper permisions to your kubeconfig

```bash
sudo cp /root/.kube/config ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
```

### Istio with Ambient profile

Download `istioctl` binary from the expermimental branch

```bash
wget https://storage.googleapis.com/istio-build/dev/0.0.0-ambient.191fe680b52c1754ee72a06b3e0d3f9d116f2e82/istio-0.0.0-ambient.191fe680b52c1754ee72a06b3e0d3f9d116f2e82-linux-amd64.tar.gz
tar -xvf istio-0.0.0-ambient.191fe680b52c1754ee72a06b3e0d3f9d116f2e82-linux-amd64.tar.gz
```

Install

```bash
cd istio-0.0.0-ambient.191fe680b52c1754ee72a06b3e0d3f9d116f2e82/
./bin/istioctl install -d manifests/ --set profile=ambient -y
```

Verify

```bash
kubectl -n istio-system get pods
NAME                                   READY   STATUS    RESTARTS   AGE
istio-cni-node-b6t7q                   1/1     Running   0          54s
istio-cni-node-fblgc                   1/1     Running   0          54s
istio-cni-node-z2b8g                   1/1     Running   0          55s
istio-ingressgateway-dd667dbb7-stvfg   1/1     Running   0          55s
istiod-6f9c757686-z6hq7                1/1     Running   0          2m5s
ztunnel-25j69                          1/1     Running   0          86s
ztunnel-x5lmv                          1/1     Running   0          86s
ztunnel-zk2sc                          1/1     Running   0          86s
```

### Observability

**Ambient Mesh not working properly with current tooling and dashboards**

```bash
kubectl apply -f ambient/samples/addons/prometheus.yaml
kubectl apply -f ambient/samples/addons/jaeger.yaml
kubectl apply -f ambient/samples/addons/kiali.yaml
kubectl apply -f ambient/samples/addons/grafana.yaml
```

## Demo

Deploy a demo application

```bash
mv istio-0.0.0-ambient.191fe680b52c1754ee72a06b3e0d3f9d116f2e82 ambient
kubectl apply -f ambient/samples/helloworld
kubectl apply -f ambient/samples/sleep
```

Connect to `sleep` pod

```bash
kubectl exec -it sleep-78ff5975c6-s9vbf -- sh

curl helloworld:5000/hello
```

Adding workloads to the ambient mesh by adding a label to your namesapce

`istio.io/dataplane-mode=ambient`

```bash
kubectl label namespace default istio.io/dataplane-mode=ambient --overwrite=true

kubectl label namespace default istio.io/dataplane-mode= --overwrite=true
```

Waypoint proxy

```yaml
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: Gateway
metadata:
  name: gateway-helloworld
  annotations:
    istio.io/service-account: sleep
spec:
  gatewayClassName: istio-mesh

```

```bash
kubectl apply -f manifests/waypoint.yml

# kubectl delete -f manifests/waypoint.yml
```

Waypoint policies

```yaml
# fault injection
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: helloworld
spec:
  hosts:
    - "helloworld"
  http:
    - match:
        - uri:
            exact: /hello
      fault:
        delay:
          percentage:
            value: 100.0
          fixedDelay: 5s
      route:
        - destination:
            host: helloworld
            port:
              number: 5000

```

```bash
kubectl apply -f manifests/policies.yml
curl helloworld:5000/hello

# kubectl delete -f manifests/policies.yml
```

## Debug

```
export TERM=xterm-256color
```

```bash
kubectl debug -it -n istio-system ztunnel-pl97l --image=nicolaka/netshoot

termshark -i eth0 port 5000
```

## References

* [Kind installation](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
* [Istio Ambient Mesh](https://istio.io/latest/blog/2022/introducing-ambient-mesh/)
* [HBONE](https://pkg.go.dev/github.com/costinm/hbone#section-readme)