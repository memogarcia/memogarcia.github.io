---
title: "Linux on Huawei Matebook X Pro"
date: 2018-12-04T13:10:28+01:00
draft: false
---

This laptop has very decent [specs](https://consumer.huawei.com/en/laptops/matebook-x-pro/specs/):

* [8th Generation Intel® Core™ i7-8550U processor](https://ark.intel.com/products/122589/Intel-Core-i7-8550U-Processor-8M-Cache-up-to-4-00-GHz)
* [GPU: NVIDIA® GeForce® MX150 with 2 GB GDDR5 / Intel® UHD Graphics 620](https://www.geforce.com/hardware/notebook-gpus/geforce-mx150/specifications)
* 16 GB LPDDR3 2133 MHz
* BT 4.1 (compatible with 3.0 and 2.1+EDR)
* 512 GB NVMe PCIe SSD

Don't expect running workstation level workloads in this machine but it is a wonderful dev machine.

## Things I don't like about the laptop

* Palm rejection, especially this one, maybe this is Linux.
* Sound, it only outputs sound to two speakers under Linux and it has a werid noise under high volumes.
* BIOS configuration is too limited (but this is Huawei's fault)

**Update** 14/Jul/2019

Palm rejection has improved a lot since I updated to the latest `Touchpad` software versions.

## Distro

[Ubuntu 18.04](http://releases.ubuntu.com/18.04/) with kernel `4.15.0-42-generic`

**Update** 14/Jul/2019

`do-release-upgrade` to [Ubuntu 18.10](http://releases.ubuntu.com/18.10/) and upgraded kernel version to `5.0.0-050000-generic`

## Touchpad

```bash
sudo apt install acpi acpi-support acpica-tools acpid acpidump acpitail acpitool libacpi0 laptop-detect pommed xserver-xorg-input-synaptics
```

## Nvidia drivers

```bash
sudo add-apt-repository ppa:graphics-drivers/ppa
sudo apt update
```

At this time, nvidia-driver-415 is the most up to date driver and the recommended one.

```bash
sudo ubuntu-drivers autoinstall
prime-select query
```

For high-performance graphics, use:

```bash
prime-select nvidia
# log out and log in
```

Verify nvidia is correctly installed:

```bash
sudo lshw -C display
glxinfo | grep OpenGL
```

I'm getting readings about `12W to 17W` battery discharge rate with this configuration.

For lower consumption, use:

```bash
prime-select intel
# log out and log in
```

I'm getting readings about `4.5W to 6W` battery discharge rate with this configuration.

**Update** 14/Jul/2019

After upgrading to kernel `5.0.0-050000-generic` I'm getting discharge rates of `3.5W`, not bad!!!

## Desktop Configuration

### i3wm

```bash
sudo apt install i3wm i3lock
```

`vim ~/.config/i3/config`

```bash
# HDPI
exec xrandr --dpi 220

# Applets
exec --no-startup-id nm-applet
exec --no-startup-id blueman-applet
exec --no-startup-id gtk-redshift
exec --no-startup-id megasync
exec --no-startup-id dropbox start
exec --no-startup-id flameshot

# Lock screen
bindsym $mod+l exec i3lock -c 000000

# background
exec --no-startup-id /usr/bin/feh --randomize --bg-scale /path/wallpaper/* -Z
```

And then, reload the configuration:

```bash
i3-msg reload
i3-msg restart
```

### Media keys

For screen brightness and key backlights, I'm using [Light](https://github.com/haikarainen/light)

```bash
# Sreen brightness controls
bindsym XF86MonBrightnessUp exec light -A 5
bindsym XF86MonBrightnessDown exec light -U 5

# keyboard backlight controls
bindsym XF86KbdBrightnessUp exec light -A 5
bindsym XF86KbdBrightnessDown exec light -A 5
```

For volume control, I'm using [pactl](http://manpages.ubuntu.com/manpages/precise/man1/pactl.1.html)

```bash
# Volume controls
bindsym XF86AudioLowerVolume exec /usr/bin/pactl set-sink-volume @DEFAULT_SINK@ '-5%'
bindsym XF86AudioRaiseVolume exec /usr/bin/pactl set-sink-volume @DEFAULT_SINK@ '+5%'
bindsym XF86AudioMute exec /usr/bin/pactl set-sink-mute @DEFAULT_SINK@ toggle
```

## Battery

```bash
sudo apt install powertop tlp
sudo powertop --calibrate
sudo powertop --autotune
sudo tlp start
```

## Disk I/O

Following the [graphical method](https://www.cyberciti.biz/faq/howto-linux-unix-test-disk-performance-with-dd-command/) steps on this webpage, I get the following speeds for my 512 GB NVMe PCIe SSD:

```bash
Average Read Rate: 1.4 GB/s (1000 samples)
Average Write Read: 271.5 MB/s (1000 samples)
Average Access Time: 0.11 msec (1000 samples)
```

Maybe I'm testing it wrong, but it seems to me the write speeds are quite low.

## Troubleshooting

### Unsigned driver at boot

If your Matebook X Pro does not boot after installing this nvidia driver or the one downloaded from nvidia's website then disable the `Secure Boot` option in the BIOS.

### Reconfigure the kernel

```bash
sudo apt install --reinstall linux-image-generic linux-image-4.15.0-42-generic
```

### Remove old drivers

```bash
sudo for FILE in $(dpkg-divert --list | grep nvidia-340 | awk '{print $3}'); do dpkg-divert --remove $FILE; done
```

## Using an eGPU

`in progress`

## references

* <https://github.com/ValveSoftware/steam-for-linux/issues/5707>
* <https://wiki.ubuntu.com/UEFI/SecureBoot/Signing>
* <https://codeyarns.com/2013/02/07/how-to-fix-nvidia-driver-failure-on-ubuntu/>
* <https://github.com/Syllo/nvtop>
* <https://askubuntu.com/questions/112705/how-do-i-make-powertop-changes-permanent>
* <https://int3ractive.com/2018/09/make-the-best-of-MacBook-touchpad-on-Ubuntu.html>
