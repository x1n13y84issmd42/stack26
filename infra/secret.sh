#!/bin/sh

docker exec stack26_vault vault kv get -field=$1 secret/stack26
