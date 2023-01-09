---
title: "Big O notation"
date: 2022-12-28T05:53:23+01:00
draft: false
---

Big O Notation (or the Big O) is used to describe how long and complex an operation will be based on its input.

Complexity could mean that an operation takes N amount of time, or N amount of memory, N CPU resources, etc.

There are some notations to describe this:

* `O(n)` -> The complexity grows linearly based on the size of the input.
* `O(n^2)` -> Grows at a square ratio of its input.
* `O(n^3)` -> Grows at a cube ratio of its input.
* `O(n^x)` -> And so on.


Note that the previous notations showcase that complexity always grows, at minimum as `O(n)`. But what if the complexity grows slower than linearly?

This is where `logarithm` notations can help describe those complexities.

But first, what is `logarithm` or `log`?

A logarithm is the exponent on which a number is raised, for example:

```
b^p = n
2^3 = 2x2x2
2^3 = 8
```

In this case, `p` is the logarithm

Another example:

```
log(10)^10,000 = x
10^x = 10,000
10^4 = 10,000
log(10)^10,000 = 4
```

Now that we know that the `log` is just an exponent to raise a base (`p`) we can say that:

* `O(log(n))` -> grows at a logarithmic rate based on its input.

> complexity described in `O(log(n))` is used to define “efficient” algorithms.

**But what all this means?**

Take `binary_search` for example:

> Binary Search is a searching algorithm used in a sorted array by repeatedly dividing the search interval in half. The idea of binary search is to use the information that the array is sorted and reduce the time complexity to O(Log n).

```python
def binary_search(sorted_list, value):
    low = 0
    high = len(sorted_list) - 1
    while low <= high:
        mid = (low + high) // 2
        if sorted_list[mid] == value:
            return mid
        elif value < sorted_list[mid]:
            high = mid - 1
        else:
            low = mid + 1
    return -1
```

On each iteration of this loop the input size is halved, which means that the exponent or `p` of this function is `O(log2(n))`

To solve a `O(log(n))`, take for example a list of 1024 elements and find its log.

```
O(log(2)^n)) = len(sorted_list)
O(log(2)^n)) = 1024
2^x = 1024
2^10 = 1024
log(2)^10) = 1024
```

It takes only `10` iteratios to find the value in a list of 1024 elements.

Also,

* `O(log(log(n)))` -> Grows at a double logarithm rate. or the complexity increases slower
* `O(log(log(log(n))))` -> and so on, similar to `O(n^x)`.
