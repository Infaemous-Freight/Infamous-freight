# SSH Deployment Keys

## Production Deploy Key

This SSH public key is authorized for production deployments.

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC4SMMA68UAAJNIkuMHNFeyTwwGf7ZMNDAkyU5ZFHMw5y/nLJbE9E2fKVSf4LFBaSsRx49PXCJIXt/MpvXhnLA9u7m/s6nSL4NBRKpw8fc8rVMDaYLh3O4X6sC0/6Be8nvwjfY7J/bKhZzqbhts2bE4DXAlUrQiVTPfj3A2H1/S8m5COSIC0gMQdZVVPqpy8wumoZRYwaPaZvobhyLIv1U+tcWJNmqWL5DFIDgsLDA6EEPpdcwlsllXaqdQP0oEKZo0I5XkrxdNKdLNko3CabvBTh3lCFeuYyeglCvCkvMKboEkoP0xkcdzOQlo7D0CtIa0dt4pwisVIkbNshSUu+eYmMGgWQ4CqrjAE8A7ZCTeTfXaNFcxsrBxkvidxF4zuCXhPy/X/4xdB4pDgPKGabPoKQS/GPkc9g2l/GELhHzjE6nMXW0P5uFxKnJwNAqoLHiRrUdr0BGF59I774XDweU7H3vAvG+LbLVNTbZThbZo3ISpTJz2fSiGZ8GC1QrPZnnjjz/4raYMOSxWKvFyWhxjzEwTLg5HIaUsXMN6RwGeVknY2KDCtuTC2jk4MDuluSj3fmqI5y1kOiv7+glGV7cJJyd9r5gtiix3A3hbXDpnNlPYJoAFzbHkSvEo7QMXQl5ETa8q4YAUnRBxWRsBfi9hR6dbuaFnk8iraZ+KTdNGuQ==
```

## Usage

### 1. GitHub Deploy Key

Add this key to your GitHub repository:

1. Go to: https://github.com/MrMiless44/Infamous-freight-enterprises/settings/keys
2. Click "Add deploy key"
3. Title: `Production Deploy Key`
4. Paste the key above
5. Check "Allow write access" if needed for deployments

### 2. Server SSH Access

Add to `~/.ssh/authorized_keys` on your deployment server:

```bash
# On your server
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC4SMMA68UAAJNIkuMHNFeyTwwGf7ZMNDAkyU5ZFHMw5y/nLJbE9E2fKVSf4LFBaSsRx49PXCJIXt/MpvXhnLA9u7m/s6nSL4NBRKpw8fc8rVMDaYLh3O4X6sC0/6Be8nvwjfY7J/bKhZzqbhts2bE4DXAlUrQiVTPfj3A2H1/S8m5COSIC0gMQdZVVPqpy8wumoZRYwaPaZvobhyLIv1U+tcWJNmqWL5DFIDgsLDA6EEPpdcwlsllXaqdQP0oEKZo0I5XkrxdNKdLNko3CabvBTh3lCFeuYyeglCvCkvMKboEkoP0xkcdzOQlo7D0CtIa0dt4pwisVIkbNshSUu+eYmMGgWQ4CqrjAE8A7ZCTeTfXaNFcxsrBxkvidxF4zuCXhPy/X/4xdB4pDgPKGabPoKQS/GPkc9g2l/GELhHzjE6nMXW0P5uFxKnJwNAqoLHiRrUdr0BGF59I774XDweU7H3vAvG+LbLVNTbZThbZo3ISpTJz2fSiGZ8GC1QrPZnnjjz/4raYMOSxWKvFyWhxjzEwTLg5HIaUsXMN6RwGeVknY2KDCtuTC2jk4MDuluSj3fmqI5y1kOiv7+glGV7cJJyd9r5gtiix3A3hbXDpnNlPYJoAFzbHkSvEo7QMXQl5ETa8q4YAUnRBxWRsBfi9hR6dbuaFnk8iraZ+KTdNGuQ==" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. GitHub Actions Secret

For CI/CD deployments using SSH:

1. Go to: https://github.com/MrMiless44/Infamous-freight-enterprises/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PUBLIC_KEY`
4. Value: Paste the key above
5. Click "Add secret"

For the private key (store securely):
- Name: `SSH_PRIVATE_KEY`
- Value: Your corresponding private key (keep secure!)

### 4. Docker Compose SSH Deploy

If deploying via SSH to a Docker host:

```yaml
# In docker-compose.prod.yml or similar
version: "3.9"

services:
  deploy:
    image: alpine:latest
    volumes:
      - ~/.ssh/id_rsa:/root/.ssh/id_rsa:ro
    environment:
      - SSH_KEY=${SSH_PRIVATE_KEY}
```

## Security Best Practices

- ✅ Key added to documentation
- ⚠️ Never commit private keys to version control
- ✅ Use GitHub Secrets for CI/CD private keys
- ✅ Rotate keys periodically (every 90-180 days)
- ✅ Use different keys for different environments
- ✅ Monitor key usage in GitHub audit logs

## Fingerprint

To verify this key's fingerprint:

```bash
ssh-keygen -lf <(echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC4SMMA68UAAJNIkuMHNFeyTwwGf7ZMNDAkyU5ZFHMw5y/nLJbE9E2fKVSf4LFBaSsRx49PXCJIXt/MpvXhnLA9u7m/s6nSL4NBRKpw8fc8rVMDaYLh3O4X6sC0/6Be8nvwjfY7J/bKhZzqbhts2bE4DXAlUrQiVTPfj3A2H1/S8m5COSIC0gMQdZVVPqpy8wumoZRYwaPaZvobhyLIv1U+tcWJNmqWL5DFIDgsLDA6EEPpdcwlsllXaqdQP0oEKZo0I5XkrxdNKdLNko3CabvBTh3lCFeuYyeglCvCkvMKboEkoP0xkcdzOQlo7D0CtIa0dt4pwisVIkbNshSUu+eYmMGgWQ4CqrjAE8A7ZCTeTfXaNFcxsrBxkvidxF4zuCXhPy/X/4xdB4pDgPKGabPoKQS/GPkc9g2l/GELhHzjE6nMXW0P5uFxKnJwNAqoLHiRrUdr0BGF59I774XDweU7H3vAvG+LbLVNTbZThbZo3ISpTJz2fSiGZ8GC1QrPZnnjjz/4raYMOSxWKvFyWhxjzEwTLg5HIaUsXMN6RwGeVknY2KDCtuTC2jk4MDuluSj3fmqI5y1kOiv7+glGV7cJJyd9r5gtiix3A3hbXDpnNlPYJoAFzbHkSvEo7QMXQl5ETa8q4YAUnRBxWRsBfi9hR6dbuaFnk8iraZ+KTdNGuQ==")
```

## Related Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_100_PERCENT.md](DEPLOYMENT_100_PERCENT.md) - Deployment status
- `.github/workflows/` - CI/CD pipelines using SSH

## Support

For issues with SSH key authentication:
1. Verify key is correctly added to target system
2. Check file permissions (600 for private keys, 644 for public)
3. Test connection: `ssh -T git@github.com` (for GitHub)
4. Review GitHub Actions logs for deployment failures
