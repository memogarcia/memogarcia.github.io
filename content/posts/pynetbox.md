---
title: "Generating a dynamic host inventory for ansible with Netbox"
date: 2019-01-10T23:30:44+01:00
draft: false
---

Usage:

    pip install pynetbox ansible

    ansible all -i hosts/env -m setup --tree /tmp/facts/env


```python
#!/opt/netbox/bin/python

import argparse
import json
import os
import sys

import pynetbox
import yaml

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

if sys.version_info < (3, 6):
    print("Python 3.6 is required")
    sys.exit(2)


def to_json(in_dict):
    return json.dumps(in_dict, sort_keys=True, indent=4)


def load_configuration(path="/etc/ansible/netbox.yml"):
    """ Load netbox configuration

        /etc/ansible/netbox.yml
    """
    try:
        with open(path, "r") as fd:
            return yaml.safe_load(fd)
    except yaml.YAMLError as yml_error:
        print(yml_error)


NETBOX_ENDPOINT = load_configuration()["netbox_endpoint"]
NETBOX_TOKEN = load_configuration()["netbox_token"]

if not NETBOX_ENDPOINT:
    raise OSError("environmet var NETBOX_ENDPOINT not set")
if not NETBOX_TOKEN:
    raise OSError("environmet var NETBOX_TOKEN not set")

nb = pynetbox.api(NETBOX_ENDPOINT, NETBOX_TOKEN, ssl_verify=False)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--list', action='store_true')
    parser.add_argument('--host', action='store')
    parser.add_argument('--introspection', action='store_true')
    return parser.parse_args()


def get_site(site_name):
    site = nb.dcim.sites.get(name=site_name)
    return site


def get_vms(site_name):
    platform = nb.dcim.platforms.get(name=site_name)
    vms = nb.virtualization.virtual_machines.filter(platform_id=platform.id)
    return vms


def get_devices(site_name):
    platform = nb.dcim.platforms.get(name=site_name)
    devices = nb.dcim.devices.filter(platform_id=platform.id)
    return devices


def get_roles():
    roles = nb.dcim.device_roles.all()
    return roles


def get_role(server):
    try:
        try:
            return server.role
        except:
            return server.device_role
    except Exception as error:
        return "ungrouped"


def which_tenant(server):
    try:
        if server.tenant:
            return str(server.tenant)
        else:
            # print("No tenant")
            return None
    except Exception as error:
        print(error)


def which_gmn(server):
    try:
        if "management" in server.tags:
            return "management"
        else:
            return "no_management"
    except Exception as error:
        print(error)


def get_tenants():
    tenants = nb.tenancy.tenants.all()
    return tenants


def get_device_role(site, role_name):
    platform = nb.dcim.platforms.get(name=site)
    role = nb.dcim.device_roles.get(platform_id=platform.id, name=role_name)
    if not role:
        print("Role not found")
        sys.exit(2)
    return role.id


def get_vip(site, servers):
    vms = get_vms(site)

    proxy_vms = []
    for vm in vms:
        if str(vm.role).lower() == "proxy-servers":
            proxy_vms.append(vm)

    for vm in proxy_vms:
        ips = nb.ipam.ip_addresses.filter(virtual_machine_id=vm.id)
        for ip in ips:
            if str(ip.role) == "VIP":
                return ip.address
    else:
        return ""


def get_tenant_role_map(path="/etc/ansible/role-tenant-map.json"):
    """  """
    try:
        with open(path, "r") as fd:
            return json.load(fd)
    except Exception as error:
        print(error)


def generate_inventory(site, servers):
    """ Generate ansible groups based on roles and tenants
    """
    role_tenant_map = get_tenant_role_map()
    roles = get_roles()
    tenants = get_tenants()

    # base json|yaml structure
    inventory = {
        "all": {"hosts": []},
        "management": {"children": {}},
        "no_management": {"children": {}, "vars": {}},
        "ungrouped": {"children": {}},
        "_meta": {"hostvars": {}}
    }

    proxy_vip = get_vip(site, servers).split("/")[0]
    if proxy_vip:
        inventory["no_gmn"]["vars"] = {
            "ansible_ssh_common_args": f"'-o ProxyJump={proxy_vip} -o StrictHostKeyChecking=no'"
        }

    for tenant in tenants:
        inventory[tenant.name] = {"children": {}}
        for role in role_tenant_map[tenant.name]:
            inventory[tenant.name]["children"][role] = {}

    for role in roles:
        inventory[role.name] = {"hosts": []}
        if role.name == "proxy-servers":
            inventory["management"]["children"][role.name] = {}
        else:
            inventory["no_management"]["children"][role.name] = {}

    for server in servers:
        ip = str(server.primary_ip).split("/")[0]
        role = str(get_role(server))
        inventory["all"]["hosts"].append(server.name)
        inventory["_meta"]["hostvars"][server.name] = {
            "ansible_host": f"{ip}"
        }
        if role != "None":
            inventory[role]["hosts"].append(server.name)

    return to_json(inventory)


def get_introspection_data(site_name):
    """
    site_name: str: SITE1, SITE2, etc.

    return list(dicts)
    [
        {
            "mac": "pxe mac",
            "arch": "x86_64",
            "pm_type": "pxe_ilo",
            "pm_user": "static per site",
            "pm_password": "static per site",
            "pm_address": "IPMI address"
            "name": "position name"
        },
    ]

    steps:
        query devices api on a given site (platform) for computes and controllers
        get pm_user and pm_password from somewhere
        get IPMI address
    """
    openstack_nodes = []
    platform = nb.dcim.platforms.get(name=site_name)
    devices = nb.dcim.devices.filter(platform_id=platform.id)
    for device in devices:
        if device.custom_fields["openstack_device"]:
            d = {
                "name": device.name,
                "mac": [device.custom_fields["openstack_pxeboot_mac"]],
                "pm_type": "pxe_ilo",
                "arch": "x86_64",
                "pm_user": os.environ.get("OS_INTROSPECTION_USER", None),
                "pm_password": os.environ.get("OS_INTROSPECTION_PASSWORD", None)
            }
            interfaces = nb.dcim.interfaces.filter(device_id=device.id)
            for i in interfaces:
                if i.name == "ILO":
                    ilo_ip = nb.ipam.ip_addresses.filter(interface_id=i.id)[0]
                    d["pm_address"] = ilo_ip.address.split("/")[0]
            openstack_nodes.append(d)
    return to_json(openstack_nodes)


if __name__ == "__main__":
    args = parse_args()
    # Are "-" deprecated in group names?
    site_name = os.environ.get("SITE", None)
    if not site_name:
        print("Define a site to query with SITE environment variable")
        sys.exit(2)
    site_name = site_name.upper()

    if args.introspection:
        introspection_data = get_introspection_data(site_name)
        print(introspection_data)
        sys.exit(0)

    devices = get_devices(site_name)
    vms = get_vms(site_name)
    servers = devices + vms

    if args.list:
        hosts = generate_inventory(site_name, servers)
        print(hosts)
    elif args.host:
        pass
```