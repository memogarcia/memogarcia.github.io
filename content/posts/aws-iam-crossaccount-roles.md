---
title: "AWS | Cross-Account IAM Role Assumption"
date: 2024-05-04T00:55:24+09:00
draft: false
---

In AWS, in order to access resources in other accounts without creating new users or handling passwords, you can use [sts:AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html).

Let's say that you have some resources in `AccountA` (AWS Managed Prometheus for example) that you want to access from `AccountB`

![crossaccount](/img/crossaccount.png)

## Account A

In `AccountA` create a role `account_a_role` that has 2 types of policies:

1. a `Trust Relationship` that define which entities can assume this role

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAssumeRoleFromAccountB",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::ACCOUNT_B_ID:role/account_b_role"
            },
           "Action": "sts:AssumeRole"
        }
    ]
}
```

You can also set `Conditions` to filter which entities can `AssumeRole` and even configure [AssumeRoleWithWebIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html) for users who have been authenticated with a web identity provider.

2. a `Permission Policy` that defines what this role can do, for example, `aps:remoteWrite` to AWS Managed Prometheus

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PrometheusRemoteWrite",
            "Effect": "Allow",
            "Action": [
                "aps:remoteWrite"
            ],
            "Resource": "aws_managed_prometheus_arn"
        }
    ]
}
```

## Account B

In `AccountB`, create a role `account_b_role` with a single policy (for this purpose) that can assume the role of `AccountA`

1. a `Permission Policy` that defines the `sts:AssumeRole` permission

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PrometheusRemoteWrite",
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": "arn:aws:iam::ACCOUNT_A_ID:role/account_a_role"
        }
    ]
}
```

## IRSA or Pod Identities

This topic is not cover in this post, but if you want to configure an EKS service account to assume an AWS role to perform the above take a look at [EKS Pod Identities](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html) and [IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)

## References

* [How IAM works](https://docs.aws.amazon.com/IAM/latest/UserGuide/intro-structure.html#intro-structure-principal)