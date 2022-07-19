---
title: "Setup multiple git identities and pgp keys"
date: 2022-03-04T02:03:30+01:00
draft: false
---

Be very carrefull in your setup : **any misconfiguration make all the git config to fail silently !**

## Setup multiple git ssh identities for git

* Generate your SSH keys as per your git provider documentation.
* Add each public SSH keys to your git providers acounts.
* In your `~/.ssh/config`, set each ssh key for each repository as in this exemple:

``` bash
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_private_key
  IdentitiesOnly=yes
Host gitlab.com
  Hostname gitlab.com
  User git
  IdentityFile ~/.ssh/gitlab_private_key
  IdentitiesOnly=yes
```

## Setup dynamic git user email & name depending on folder

**Require git 2.13+ for conditional include support.**

The idea here is to use a different git user name and email depending on the folder you are in.

* In your `~/.gitconfig`, **remove** the `[user]` block and add the following (adapt this exemple to your needs) :

``` bash
[includeIf "gitdir:~/src/personal/"]
  path = .gitconfig-personal
[includeIf "gitdir:~/src/work/"]
  path = .gitconfig-work
```
* In your `~/.gitconfig-personal`, add your personnal user informations:

``` bash
[user]
  email = user.personal@email.com
  name = personal_username
```

* In your `~/.gitconfig-work`, add your professional user informations:

``` bash
[user]
  email = user.professional@company.com
  name = professional_username
```

## Setup a GPG key

If you need to add a GPG key and bind it to a user to sign your commits, you can do so like this:

You should have GPG installed and configured like the [GPG suite](https://gpgtools.org/)

* Add the GPG key ID to your `~/.gitconfig-{PROFILE}` config and enable commit signing:

```bash
[user]
  email = your.mail@domain.com
  name = Your NAME
  signingkey = SIGNING_KEY_ID
[commit]
  gpgsign = true
```

* Make sure to register the right GPG binary in your `~/.gitconfig`:

```bash
[program]
  pgp = /path/to/your/gpg2/bin
```

## Test your setup

* Now each repository will use the custom user info setup depending on the top-level folder.
* Check your settings are taken into account, for instance in `~/src/git/personal/` :

``` bash
cd ~/src/git/personal/
git config --get user.email
git config --get user.name
git config --get user.signingkey
```
* Do the same for each folder you have setup.
* You can also display and check the global git config: `git config --list --global`
  * Or just the local config for the repository folder you are in: `git config --list`

## Exporting Public GPG key

    gpg --list-keys
    gpg --armor --export {KEY-ID}


## References

* [Generating a new GPG key](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)
* [Telling Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)