---
title: "Generating a dynamic host inventory for ansible with Netbox"
date: 2019-01-10T23:30:44+01:00
draft: true
tags: python, netbox
---

TODO: steps are incomplete

Usage:

    pip install pynetbox ansible

    ansible all -i hosts/env -m setup --tree /tmp/facts/env


```python
import pynetbox


NETBOX_ENDPOINT = os.environ.get("NETBOX_ENDPOINT", default=None)
NETBOX_TOKEN = os.environ.get("NETBOX_TOKEN", default=None)

if not NETBOX_ENDPOINT:
    raise OSError("environmet var NETBOX_ENDPOINT not set")
if not NETBOX_TOKEN:
    raise OSError("environmet var NETBOX_TOKEN not set")

nb = pynetbox.api(NETBOX_ENDPOINT, NETBOX_TOKEN)


def create_vm(vm_metadata):
    """Create a VM on Netbox"""
    with open("{0}".format(vm_metadata.lower()), "r") as fd:
        d = json.load(fd)

    interfaces = d["ansible_facts"]["ansible_interfaces"]
    interfaces_data = []
    for interface in interfaces:
        if interface == "lo":
            continue
        try:
            i = d["ansible_facts"]["ansible_{0}".format(interface)]
        except KeyError:
            pass
        if not "ipv4" in i.keys():
            continue
        network = {**i["ipv4"]}
        network["interface"] = interface
        interfaces_data.append(network)

    try:
        disk_size = d["ansible_facts"]["ansible_devices"]["sda"]["size"].split(".")[0]
    except Exception:
        disk_size = 0

    vm = {
            "name": d["ansible_facts"]["ansible_hostname"],
            "cluster": 1,
            "vcpus": d["ansible_facts"]["ansible_processor_cores"] * d["ansible_facts"]["ansible_processor_threads_per_core"],
            "memory": d["ansible_facts"]["ansible_memtotal_mb"],
            # "disk": d["ansible_facts"]["ansible_devices"]["nvme0n1"]["size"].split(".")[0]
            "disk": disk_size
    }

    try:
        nb.virtualization.virtual_machines.create(**vm)
    except Exception as error:
        print(error)
    # TODO: m3m0, interfaces can be added again, and ips

    try:
        vm = nb.virtualization.virtual_machines.get(
            name=d["ansible_hostname"]
        )
        for i in interfaces_data:

            vi = nb.virtualization.interfaces.create(
                virtual_machine=vm.id,
                name=i["interface"]
            )

            mask = IPAddress(i["netmask"]).netmask_bits()
            ip = "{0}/{1}".format(i["address"], mask)

            nb.ipam.ip_addresses.create(
                address=ip,
                virtual_machine=vm.id,
                interface=vi.id
            )
    except Exception as error:
        print(error)
    print("Warning, vms don't get created with the right cluster info, please modify it manually")

if __name__ = "__main__":
    create_vm("/tmp/facts/env/192.168.0.1")
```