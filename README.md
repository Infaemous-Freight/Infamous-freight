## Local Infrastructure Smoke Test

You can start the local stack and verify health with:

```bash
make infra-up
make infra-logs
make smoke
make infra-down
```

This will:
	• start PostgreSQL, Redis, and the API locally
	• wait for services to become healthy
	• verify the API health endpoint responds successfully