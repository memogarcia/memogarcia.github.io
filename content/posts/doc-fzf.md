---
title: "Modular CLI Documentation Fuzzy Finder"
date: 2019-06-14T15:03:30+01:00
draft: false
---

Fuzzy Search documentation from the CLI.

See it in action here [https://terminalizer.com/view/2c3935cf1418](https://terminalizer.com/view/2c3935cf1418)

**Disclaimer** This tool was built to learn `FZF` capabilities. Feel free to use it or extend it.

## Usage

```bash
doc-fzf ansible
doc-fzf ansible -q yum
```

## Installation

```bash
pip3 install doc-fzf
```

Verify your installation:

```bash
doc-fzf -h

usage: doc-fzf.py [-h] [-q QUERY] module_name

doc-fzf.

positional arguments:
module_name  Name of the module to search

optional arguments:
-h, --help   show this help message and exit
-q QUERY     Query the docs
```

## Extending Doc-FZF

`doc-fzf` is a modular application. It can load modules at runtime that scrap websites in any way you like.

Any module should always contain:

* class name must always be `Screapper(FZFDoc)`
* `self.documentation_url` attribute
* `def get_documentation(self):` function that must always return a tuple ("url", "description")

```python
from doc_fzf.pyfzf import FZFDoc


class Scrapper(FZFDoc):
    def __init__(self):
        self.base_url = "https://docs.python.org/3"
        self.documentation_url = "{0}/py-modindex.html".format(self.base_url)
        FZFDoc.__init__(self, self.documentation_url)

    def get_documentation(self):
        """ Return a tuple of (url, description)
        """
        docs = get_online_documentation()
        for doc in docs:
            yield (doc.url, doc.description)
```

Here is the [ansible documentation example](https://gitlab.com/memogarcia/doc-fzf/blob/master/doc_fzf/modules/ansible.py)

## Road Map

* [x] Module definition
* [x] FZFDoc base class
* [x] File system cache layer
* [ ] Load dynamic modules

## References

* [Doc-FZF: Modular CLI Documentation Fuzzy Finder](https://https://memogarcia.mx/posts/doc-fzf)
* [fzf, A command-line fuzzy finder](https://github.com/junegunn/fzf)
* [iterfzf, Pythonic interface to fzf, a CLI fuzzy finder](https://github.com/dahlia/iterfzf)
