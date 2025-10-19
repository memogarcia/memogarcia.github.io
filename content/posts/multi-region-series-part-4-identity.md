---
title: "Multi Region Cloud Training Lab: Part 4 - AWS Identity (IRSA vs Pod Identity)"
date: 2025-10-17T09:13:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-04-identity/
---

Problem: Let workloads call AWS without node credentials.

Assumptions/Constraints

- Cost note: Two clusters, not two AWS regions.
- Choose one path: IRSA or EKS Pod Identity. Do not mix for the same service account.

ASCII Diagram

```
              IRSA path                           Pod Identity path
  +-----------------------------+          +-----------------------------+
  | [Pod + SA aws-sa]           |          | [Pod + SA aws-sa]           |
  |   token (OIDC projected)    |          |   request to EKS agent      |
  +--------------|--------------+          +--------------|--------------+
                 v                                        v
         [IAM OIDC Provider]                      [EKS Pod Identity Agent]
                 |                                        |
                 v                                        v
         [STS AssumeRoleWithWebIdentity]          [STS AssumeRole]
                 |                                        |
                 v                                        v
             [Temp creds]                           [Temp creds]
                 \________________________________________/
                                  |
                                  v
                               [AWS APIs]

 Notes: IRSA supports Fargate and non EKS clusters with OIDC; Pod Identity is EKS only.
```

Steps (IRSA)

1) Create an IAM role that trusts the cluster OIDC provider and service account.
2) Annotate the workload service account with the role ARN.

Example trust policy snippet

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

Kubernetes service account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aws-sa
  namespace: echo
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<acct>:role/echo-irsa-role
```

Steps (EKS Pod Identity)

1) Create an IAM role.
2) Bind it to a namespace and service account with a Pod Identity association.

Example association

```bash
aws eks create-pod-identity-association \
  --cluster-name prod-us \
  --namespace echo \
  --service-account aws-sa \
  --role-arn arn:aws:iam::<acct>:role/echo-podid-role
```

Verification/DoD

- A pod using `aws-sa` can call `sts:GetCallerIdentity` and returns the role.

Note: IRSA vs EKS Pod Identity

- Platform scope: IRSA works for EKS and other Kubernetes clusters that use an IAM OIDC provider, including self managed clusters on EC2 and EKS Anywhere. EKS Pod Identity is EKS only and does not support EKS Anywhere or self managed clusters.
- Node and runtime support: Pod Identity currently supports Linux EC2 worker nodes and does not support Fargate or Windows pods. IRSA supports both EC2 and Fargate.
- Setup model: IRSA requires an IAM OIDC provider per cluster and trust policy conditions that match a Kubernetes service account. Pods use a projected web identity token. Pod Identity uses an EKS managed agent (DaemonSet) and a Pod Identity association API; the agent vends credentials to pods.
- Cross account and reuse: Both can access resources in other accounts. Pod Identity added simplified cross account support in 2025. IRSA uses standard cross account trust policies. Pod Identity helps reuse the same role across multiple clusters without editing OIDC trust per cluster.

References

- EKS Pod Identity docs (limits and setup): https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html
- EKS Pod Identity cross account update (2025 06 12): https://aws.amazon.com/about-aws/whats-new/2025/06/amazon-eks-pod-identity-cross-account-access
- IRSA overview: https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html
- IRSA SDK/credential chain notes: https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts-minimum-sdk.html
- Fargate execution role and IRSA note: https://docs.aws.amazon.com/eks/latest/userguide/pod-execution-role.html

Previous: [Part 3](/posts/multi-region-series-part-3-istio/) · Next: [Part 5](/posts/multi-region-series-part-5-app/)
