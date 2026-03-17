#!/bin/sh

# Waiting for Vault server to start, the dumb way.
# (wait-for-it.sh requires bash which is missing in the Vault image)
echo "Sleeping for 5 seconds..."
sleep 5

echo "Seeding secrets to Vault..."

vault kv put secret/stack26 \
 amqp_host=localhost \
 amqp_user=xxx \
 amqp_pass=zzz \
 test_queue_name=yolo_q \
 api_host=localhost \
 api_port=81 \
 ui_port=80 \


echo "Vault secrets are ready."
