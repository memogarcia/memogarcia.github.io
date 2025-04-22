---
title: "Python templates when writing bash and python"
date: 2022-07-02T00:00:00+01:00
draft: true
---

I write a lot of bash scripts to automate and glue services together however, parsing cli or api outputs becomes messy very quickly with bash alone.

This python script template has features for some of the use cases I have:

## Use case: Parse stdin

I use this when I want to work with piped data.

```bash
cat README.md | python3 for_bash.py --stdin
```

```python
import argparse


def arguments():
    """
    https://docs.python.org/3/library/argparse.html
    """
    parser = argparse.ArgumentParser(description="Complement bash functionality")
    parser.add_argument("--stdin", action="store_true", dest="stdin", help="Read from stdin")
    return parser.parse_args()


def read_stdin():
    """
    Read data from stdin and yield line by line
    """
    while True:
        try:
            data = input()
            yield data
        except EOFError:
            break


def main():
    """
    Read line by line from STDIN
    """
    for line in read_stdin():
        print(line)


if __name__ == "__main__":
    input_arguments = arguments()
    main(input_arguments)

```

## Use case: Subprocess

I use this when I want to work with the output of the subprocess directly in python.

```bash
python3 for_bash.py --subprocess "ls -altrh"
```

```python
import argparse
import shlex
import subprocess
import sys


def arguments():
    """
    https://docs.python.org/3/library/argparse.html
    """
    parser = argparse.ArgumentParser(description="Complement bash functionality")
    parser.add_argument(
        "--subprocess",
        dest="subprocess",
        help="Run a subprocess in your shell",
    )
    return parser.parse_args()


def run_subprocess(command, timeout=15):
    """
    Run a command from python to your shell.

    Returns two outputs:
        success (outs), errors (errs)
    """
    command_as_list = shlex.split(command)
    outs, errs = None, None
    environment = os.environ
    try:
        proc = subprocess.Popen(
            command_as_list,
            env=environment,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            close_fds=True,
            universal_newlines=True,
        )
        outs, errs = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        print("Timeout reached")
        proc.kill()
        outs, errs = proc.communicate()
    except Exception:
        outs, errs = proc.communicate()
    return outs, errs


def main():
    """
    Execute a subprocess from python
    """
    cmd = args.subprocess
    outs, errs = run_subprocess(cmd)
    if errs:
        print(errs)
        sys.exit()
    else:
        print(outs.strip())


if __name__ == "__main__":
    input_arguments = arguments()
    main(input_arguments)

```