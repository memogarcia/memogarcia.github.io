---
title: "Deploying OpenStack with Docker"
date: 2018-05-05T18:53:14+01:00
draft: false
---

**Note** This is a Work-In-Progress Document and the most up-to-date information is available at: [github.com/memogarcia/openstack-deployer](https://github.com/memogarcia/openstack-deployer)

Deploying OpenStack using containers allows easy customisation and flexibility on how to deploy the platform for development, testing and _production_ environments.

Current deployment: **stable/queens**

## Host configuration

The default configuration for this environment is composed by 3 main components that need to run on the host:

* [Docker](https://github.com/memogarcia/openstack-deployer/tree/master/services/infra/docker/README.md)
* [Libvirtd](https://github.com/memogarcia/openstack-deployer/tree/master/services/infra/libvirtd/README.md)
* [OpenVSwitch](https://github.com/memogarcia/openstack-deployer/tree/master/services/infra/openvswitch/README.md)

Docker will act as the control plane for OpenStack while the host will provide the hypervisor, network and storage.

![host_diagram](https://github.com/memogarcia/openstack-deployer/blob/master/services/infra/docker/host.png?raw=true)

## Network topology

This is the default network topology, 2 networks are used:

* openstack-management-net: All openstack traffic goes through here
* openstack-provider-net: Instances get IPs in this network

![simplified_network_diagram](https://github.com/memogarcia/openstack-deployer/blob/master/services/infra/docker/simplified_networks.png?raw=true)

## Infra services

* Fluentd: for logging
* Cadvisor: for container stats
* Elasticsearch: for log collection
* Kibana: for log visualization
* Portainer: for container management

## Third-party services

Configure the third-party services needed for OpenStack to run.

* [Seed](https://github.com/memogarcia/openstack-deployer/tree/master/services/third-party/seed/README.md)
* [MariaDB/MySQL](https://github.com/memogarcia/openstack-deployer/tree/master/services/third-party/mariadb/README.md)
* [PostgreSQL](https://github.com/memogarcia/openstack-deployer/tree/master/services/third-party/postgresql/README.md) **Optional Database**
* [Memcached](https://github.com/memogarcia/openstack-deployer/tree/master/services/third-party/memcached/README.md)
* [Rabbitmq](https://github.com/memogarcia/openstack-deployer/tree/master/services/third-party/rabbitmq/README.md)
* [Onos](https://github.com/memogarcia/openstack-deployer/tree/master/services/third-party/onos/README.md) **Optional SDN**
* [Minio](https://github.com/memogarcia/openstack-deployer/tree/master/services/third-party/minio/README.md) **Optional Object Storage**

## OpenStack services

* [Keystone](https://github.com/memogarcia/openstack-deployer/tree/master/services/openstack/keystone/README.md)
* [Glance](https://github.com/memogarcia/openstack-deployer/tree/master/services/openstack/glance/README.md)
* [Neutron](https://github.com/memogarcia/openstack-deployer/tree/master/services/openstack/neutron/README.md)
* [Nova](https://github.com/memogarcia/openstack-deployer/tree/master/services/openstack/nova/README.md)
* [Nova-Qemu](https://github.com/memogarcia/openstack-deployer/tree/master/services/openstack/nova-qemu/README.md)
* [Cinder](https://github.com/memogarcia/openstack-deployer/tree/master/services/openstack/cinder/README.md)
* [Horizon](https://github.com/memogarcia/openstack-deployer/tree/master/services/openstack/horizon/README.md)

## Extending OpenStack services

* [Custom API](https://github.com/memogarcia/openstack-deployer/tree/master/services/custom/api/README.md)
* [Custom Backend](https://github.com/memogarcia/openstack-deployer/tree/master/services/custom/backend/README.md)

## Deploying OpenStack

The model is a yml file describing how your environment should look like. It defines the services to run, networks, ips, volumes, dependencies, etc.

Configure your runtime environment by modifying [model.yml](https://github.com/memogarcia/openstack-deployer/blob/master/model.yml).

Apply the configuration with `config_processor`, which will create the necessary scripts to run the environment.

```bash
ansible-playbook -i hosts/localhost config_processor.yml
```

Config processor will create a new branch `deploy` where the runtime configuration will be ready for deployment.

Verify the branch is created correctly.

```bash
git branch
# * deploy
git log
# Ready for deployment
```

Deploy OpenStack

```bash
./scripts/docker-network-create.sh
./scripts/build.sh
./scripts/start.sh
```

## Verify installation

```bash
source osrc-v3
openstack project list
openstack image list
openstack network list
openstack server list
```

## References

[OpenStack installation Guide](https://docs.openstack.org/install-guide/)
