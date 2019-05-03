#!/bin/sh
while true; do
    nodejs bot.js
    [ $? -ne 137 ] && break
done
