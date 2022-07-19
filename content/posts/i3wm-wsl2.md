---
title: "i3 running on WSL2"
date: 2020-09-23T14:53:23+01:00
draft: false
---

## WSL configuration

1. Install i3

        sudo apt install i3 -y

2. Create an init script

        vim ~/src/scripts/i3launch.sh

```shell
#!/bin/zsh
source ~/.zshrc
# If not running interactively, don't do anything
[ -z "$PS1" ] && return

export DISPLAY=$(awk '/nameserver / {print $2; exit}' /etc/resolv.conf 2>/dev/null):0
export LIBGL_ALWAYS_INDIRECT=1

dbus_status=$(service dbus status)
if [[ $dbus_status = *"is not running"* ]]; then
  sudo service dbus --full-restart
fi
i3
```

To run WSL2 as root

    wsl.exe -d Ubuntu-20.04 -u root -- /bin/bash

## Windows configuration

1. Install `vcxsrv` from powershell

        winget install vcxsrv

With WSL2 you need to configure your firewall to allow `WSL` and `vcxsrv` to communicate.

Search for `Windows Defender Firewall with Advanced Security` and do the following:

2. Create an inbound rule:

        name: wsl2
        rule type: port
        port type: tcp
        port number: 6000

3. Narrow the scope of your inbound rule:

        Right click -> Properties -> scope -> Remote IP addresses -> Add

        172.16.0.0/12

4. Search for `VcXsrv windows xserver` inbound rules and make sure the 4 rules are `enabled` and in `allow` mode

![firewall1](/img/wsl.png)

5. Startup i3 script from Windows `vcxsrv.vbs`

        code vcxsrv.vbs

```powershell
Set shell = CreateObject("WScript.Shell" ) 

shell.Run """C:\Program Files\VcXsrv\vcxsrv.exe"" :0 -screen 0 @1 -ac -engine 1 -nodecoration -wgl"

WScript.Sleep 200

shell.Run "wsl.exe -d YOUR_DISTRO -u YOUR_USER -- /bin/zsh ~/src/scripts/i3launch.sh", 0
```

6. And just run your script from powershell

        .\vcxsrv.vbs

You should see this screen.

![i3](/img/i3.png)

## i3 configuration

Up to you.

## References

* [Running i3 Desktop with WSL on Windows 10](https://techzerker.com/2020-04-19-wsl-i3-windows/)
* [How to set up working X11 forwarding on WSL2](https://stackoverflow.com/questions/61110603/how-to-set-up-working-x11-forwarding-on-wsl2)
* [WSL Windows Toolbar Launcher](https://github.com/cascadium/wsl-windows-toolbar-launcher/blob/master/README.md#troubleshooting)