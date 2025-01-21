#!/bin/bash

source ../aider/.venv/bin/activate

aider \
    --model r1 \
    --yes-always \
    --no-detect-urls \
    --no-auto-commit \
    --cache-prompts