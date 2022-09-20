#!/bin/bash

for (( ;; ))
do
  echo Starting node $* at `date`
  node $* server.js
done
