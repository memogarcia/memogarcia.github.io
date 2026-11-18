---
title: "Multi-Region Cloud Training, Part 4: AWS Identity (IRSA vs Pod Identity)"
date: 2025-10-17T09:13:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-04-identity/
---

Skip this part if you are running local `kind` or `k3d` clusters without AWS.

Workloads on Kubernetes often need to call AWS APIs (S3, SNS, DynamoDB). Static IAM access keys stored in secrets leak easily and require manual rotation. Attaching an IAM role to the EC2 worker node gives every pod on that node the same permissions.

To scope credentials to a single Kubernetes `ServiceAccount`, AWS offers two mechanisms: **IRSA (IAM Roles for Service Accounts)** and **EKS Pod Identity**. Pick one path per application and avoid mixing both on the same `ServiceAccount`.

```text
              IRSA Architecture                   Pod Identity Architecture
  +-----------------------------+          +-----------------------------+
  | [Pod + SA aws-sa]           |          | [Pod + SA aws-sa]           |
  |   projected OIDC token      |          |   request to local agent    |
  +--------------|--------------+          +--------------|--------------+
                 ▼                                        ▼
         [IAM OIDC Provider]                      [EKS Pod Identity Agent]
                 │                                        │
                 ▼                                        ▼
    [STS AssumeRoleWithWebIdentity]        [EKS Auth AssumeRoleForPodIdentity]
                 │                                        │
                 │                                        ▼
                 │                              [STS AssumeRole + TagSession]
                 ▼                                        ▼
             [Temp creds]                           [Temp creds]
                 ╲________________________________________╱
                                  │
                                  ▼
                               [AWS APIs]
```

## Option 1: IRSA (IAM Roles for Service Accounts)

IRSA uses OpenID Connect (OIDC). The cluster issues a signed projected service-account JWT to the pod, and the AWS SDK inside the pod exchanges that JWT with AWS STS via `sts:AssumeRoleWithWebIdentity` for temporary credentials.

IRSA works on EKS, AWS Fargate, EKS Anywhere, and self-managed clusters that register an OIDC issuer with IAM (self-managed clusters also need the pod identity mutating webhook or manual token projection). The drawback across multiple clusters is policy sprawl: every cluster has its own OIDC issuer URL, so each cluster needs its own trust statement.

Create an IAM role whose trust policy restricts `sub` to `system:serviceaccount:echo:aws-sa`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "arn:aws:iam::<acct>:oidc-provider/<cluster-oidc>" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "<cluster-oidc>:aud": "sts.amazonaws.com",
          "<cluster-oidc>:sub": "system:serviceaccount:echo:aws-sa"
        }
      }
    }
  ]
}
```

Create and annotate the `ServiceAccount` in both clusters (replacing `<acct>` and using the matching role ARN):

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aws-sa
  namespace: echo
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<acct>:role/echo-irsa-role
```

## Option 2: EKS Pod Identity

EKS Pod Identity removes per-cluster OIDC trust policies. A node-level agent (`eks-pod-identity-agent` DaemonSet) intercepts credential requests from pods, calls the EKS Auth API (`eks-auth:AssumeRoleForPodIdentity`), and returns temporary credentials backed by STS. One IAM role trust policy can serve multiple EKS clusters.

Constraints to keep in mind:

- Works on Amazon EKS only (no self-managed clusters or EKS Anywhere).
- Requires Linux Amazon EC2 worker nodes (no Fargate and no Windows nodes).
- The worker node IAM role must allow `eks-auth:AssumeRoleForPodIdentity`.

Install the EKS Pod Identity Agent add-on on both EKS clusters (assuming your EKS clusters are named `prod-us` and `prod-eu`):

```bash
aws eks create-addon \
  --cluster-name prod-us \
  --addon-name eks-pod-identity-agent

aws eks create-addon \
  --cluster-name prod-eu \
  --addon-name eks-pod-identity-agent
```

Create an IAM role trusting `pods.eks.amazonaws.com` with both `sts:AssumeRole` and `sts:TagSession`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "pods.eks.amazonaws.com" },
      "Action": [
        "sts:AssumeRole",
        "sts:TagSession"
      ]
    }
  ]
}
```

Create the unannotated `ServiceAccount` in both clusters:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aws-sa
  namespace: echo
```

Map the IAM role to `echo/aws-sa` in each EKS cluster:

```bash
aws eks create-pod-identity-association \
  --cluster-name prod-us \
  --namespace echo \
  --service-account aws-sa \
  --role-arn arn:aws:iam::<acct>:role/echo-podid-role

aws eks create-pod-identity-association \
  --cluster-name prod-eu \
  --namespace echo \
  --service-account aws-sa \
  --role-arn arn:aws:iam::<acct>:role/echo-podid-role
```

## Verification

Run a short-lived check pod using `aws-sa` in each cluster (the `echo` namespace must already exist):

```bash
kubectl --context prod-us-east-1 -n echo run aws-check --rm -it --restart=Never \
  --image=amazon/aws-cli \
  --overrides='{"spec":{"serviceAccountName":"aws-sa"}}' \
  -- sts get-caller-identity
```

Repeat with `--context prod-eu-west-1`. The returned ARN should be `echo-irsa-role` or `echo-podid-role`, not the EC2 worker node role.

[Previous: Part 3](/posts/multi-region-series-part-3-istio/) · [Index](/posts/multi-region-learning/) · [Next: Part 5](/posts/multi-region-series-part-5-app/)
