IMAGE ?= ghcr.io/$(shell basename $(git config --get remote.origin.url | sed -e 's#.*/##' -e 's/.git$//')):latest
SSH_PORT ?= 22

.PHONY: image deploy

image:
	docker buildx build --platform linux/amd64,linux/arm64 -t $(IMAGE) --push frontend

deploy:
	ansible-playbook -i ansible/inventory.yml ansible/cluster.yml
