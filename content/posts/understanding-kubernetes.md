---
title: "Demystifying Kubernetes"
date: 2022-06-30T00:00:00+01:00
draft: false
---

Kubernetes is becoming a monster and as it grows it becomes more and more challenging for newcomers to understand it.

My goal is to demystify its components.


## Main components

There are two main components in a Kubernetes cluster.

1. Master nodes
2. Worker nodes

* The only difference is the workloads they run.
* You can assign metadata to these nodes to schedule specific workloads on each node or type of node.

## For Users

### Containers

* A container is a filesystem and process wrapped in a “box” with some labels on it.

### Volumes

* A volume is a filesystem that lives outside the container.

### Pods

* Organize containers (one or more) and a volume(s) as a single unit
* This is the basic unit on which Kubernetes works.
* A pod has an IP (or more depending on your CNI)


### ConfigMaps

* Are just files that are mounted in pods (specifically, they are mounted in a container)

### Secrets

* Are just files that are mounted in the pods but the data is encoded. (specifically, they are mounted in a container).

**Note** This is insecure, take a look at different approaches if security is important

### Deployment

* Is a way to tell Kubernetes the desired state of your pods, services, and volumes.
* It also tells Kubernetes how you want to deploy your pods, how many replicas (replicaset) or if you want a fixed amount of pods for a database cluster for example.(statefulset)

### Service

* Service has an IP that redirects traffic to your pod(s)

### Selectors

* This is how you map a service to a pod using labels

### Ingress

* Create rules to allow traffic from outside the cluster to inside the cluster

### Imperative vs Declarative mode

* You tell Kubernetes what you want to do:

`kubectl create ns namespace`

* You tell Kubernetes the desired state of your resource.

`kubectl create -f resource.yml`

## For Operators

Kubernetes control plane is composed of the following components:

## kube-apiserver

* Runs in master nodes
* Creates resources in the cluster
* Custom resource definitions is a way to add features to the api 
* Stores things in etcd or sqlite (for k3s)

## kube-scheduler

* Runs in the master node (a single instance at a time)
* It watches the kube-apiserver and schedules resources in nodes
* You can specify or give hints to the scheduler where you want your resources to live
* Custom schedulers are allowed, and more than 1 scheduler is allowed 

## kube-controller-manager

* Runs in the master node (a single instance at a time)
* Delegates tasks to the rest of the managers to manage resources
	* `namespace-manager`
	* `deployment-manager`
	* `replicase-manager`
	* `secret-manager`
	* `operators` are custom `controller-managers`
* In other words, `*-managers`, are a bunch of for loops watching for changes in the Kubernetes API and applying them to the cluster.
* They also watch for changes in the cluster against the desired state and make sure they match it.


## kubelet

* Runs in all nodes
* It creates containers
* It talks to container runtimes (`rkt`, `docker`, `podman`, etc.)
* Interacts with liveness probes
* Interacts with readiness probes

## kube-proxy

* Runs in all nodes
* It creates services and its underlying `iptables`

**anything can be extended or replaced**

## Kubernetes networking

### Pod

* Has a unique IP and has a CIDR 

### Services

* A service has a port that listens to traffic from outside a pod(s) and sends it to the pod(s) 
* Is an abstraction to give a name instead of an IP for other services to reach a pod(s)
* Types:
	* ClusterIP
		* The ClusterIP does not “live” in your interfaces, is an `iptables` rule created by `kube-proxy` manages this
	* NodePort
		* Still has a ClusterIP but also has a port in the node where the pod lives
		* It is also an `iptables` rule
	* LoadBalancer
		* This is cloud-specific on how it works
		* Point your client to your load balancer `ip:port` instead of the `node_ip:port`

