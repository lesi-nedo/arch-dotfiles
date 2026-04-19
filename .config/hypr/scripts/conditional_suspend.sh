#!/usr/bin/env bash

# Skip suspend while Strawberry is running.
if pgrep -x strawberry >/dev/null 2>&1; then
    exit 0
fi

systemctl suspend
