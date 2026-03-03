---
title: "Chapter 4: Multi-Region Cloud Training - AWS Identity (IRSA vs Pod Identity)"
date: 2025-10-17T09:13:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-04-identity/
---

When your applications run in Kubernetes, they eventually need to talk to cloud services - reading from an S3 bucket, publishing to an SNS topic, or querying DynamoDB. 

The absolute worst way to do this is by hardcoding AWS Access Keys into your application's environment variables or secrets. It's a massive security vulnerability waiting to happen. The slightly less terrible way is assigning an IAM role to the underlying EC2 worker nodes, but that breaks the principle of least privilege (every pod on that node gets the same permissions).

We want our identity scoped directly to the Pod. AWS gives us two distinct ways to solve this in Kubernetes: **IRSA (IAM Roles for Service Accounts)** and the newer **EKS Pod Identity**.

### The Two Paths to Least Privilege

Both methods achieve the same goal (giving a specific pod temporary AWS credentials), but they do it in fundamentally different ways. You should choose one path and stick to it - don't mix them for the same application.

```text
              IRSA Architecture                   Pod Identity Architecture
  +-----------------------------+          +-----------------------------+
  | [Pod + SA aws-sa]           |          | [Pod + SA aws-sa]           |
  |   token (OIDC projected)    |          |   request to EKS agent      |
  +--------------|--------------+          +--------------|--------------+
                 ▼                                        ▼
         [IAM OIDC Provider]                      [EKS Pod Identity Agent]
                 │                                        │
                 ▼                                        ▼
    [STS AssumeRoleWithWebIdentity]                 [STS AssumeRole]
                 │                                        │
                 ▼                                        ▼
             [Temp creds]                           [Temp creds]
                 ╲________________________________________╱
                                  │
                                  ▼
                               [AWS APIs]
```

### Option 1: IRSA (IAM Roles for Service Accounts)

IRSA relies on OpenID Connect (OIDC). Your Kubernetes cluster acts as an identity provider, cryptographically signing a token and handing it to your pod. The pod takes that token to AWS STS, which verifies the signature and hands back temporary credentials. 

The beauty of IRSA is its portability. It works on EKS, self-managed clusters on EC2, EKS Anywhere, and Fargate. 

**How to set it up:**
You create an IAM role with a specific trust policy. Notice how the policy explicitly checks the `sub` (subject) claim to ensure only the `aws-sa` service account in the `echo` namespace can assume this role.

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
          "<cluster-oidc>:sub": "system:serviceaccount:echo:aws-sa"
        }
      }
    }
  ]
}
```

Then, you simply annotate your Kubernetes ServiceAccount:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aws-sa
  namespace: echo
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<acct>:role/echo-irsa-role
```

### Option 2: EKS Pod Identity

Introduced later to simplify the OIDC boilerplate, Pod Identity relies on an agent running as a DaemonSet on your worker nodes. When a pod needs credentials, it asks the local agent, which handles the STS assumed role dance for it.

Pod Identity is much easier to set up, especially across multiple clusters, because you don't need a unique OIDC trust policy for every cluster. However, it only works on EKS (no self-managed clusters) and currently does not support Fargate or Windows pods.

**How to set it up:**
You create a standard IAM role, and instead of messing with annotations and trust policies, you tell the EKS API to map the role to a specific namespace and service account:

```bash
aws eks create-pod-identity-association \
  --cluster-name prod-us \
  --namespace echo \
  --service-account aws-sa \
  --role-arn arn:aws:iam::<acct>:role/echo-podid-role
```

### Verification

Regardless of which path you chose, verifying it is simple. Exec into a pod using your `aws-sa` service account and use the AWS CLI to check your identity:

```bash
aws sts get-caller-identity
```

If it returns the ARN of your `echo-irsa-role` or `echo-podid-role` instead of your worker node's role, you've successfully implemented least-privilege identity for your workloads.

[Previous: Part 3](/posts/multi-region-series-part-3-istio/) · [Continue to Part 5: Sample App and Overlays](/posts/multi-region-series-part-5-app/)
