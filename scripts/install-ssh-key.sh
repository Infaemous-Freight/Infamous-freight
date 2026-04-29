#!/usr/bin/env bash
set -euo pipefail

KEY_INPUT="${1:-}"
DEFAULT_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCPyyxRDWUwSHYqLXqLZ+lKPs/qvzkTEFJxrfir0mTdvitjLS7jsibyCil4iLyf2JYpsIAx1b39s/v4ukx5Vo6TyHsBNjt0O5uMtI5UVzZjhToBH89XKv9LI7yF9NWkK63bOOJ7gvTiAQVdWy9Y6icTd+FaJq9d6tNcPJKumQ9w+rJUD1/bnXlGNyIBU3NUW6dQr6ptqXIHee3La3UIhq45yJU6XosfVSAGSZGsIUO/6oLvc2CzXolZNC9uRVR+qeor16np/IlMRQaO9Z2zUmgB4Hvyy5TIAZlCCM5Oy4JSg18dd0sIuXp13t2LRbkwqqiVIt7s45m2RHjEk4bHvu3y5oslgo0KIQ4B+cMZMHBw7bLgfYPJqDyyID0HSc9ODrr2AOY4EExmpdlAh+LT1CqNm8z/WVvyoulGP/SbRA0SydtAB16V8ghbDbKjvwF1WDE9kwI2wihDccqx4G7iE2flZ1o43yHvukY5z8HCKPKO+zDupvzWwE70fTj/WXQHAupftoGIYhyKoycNtOfAJICrRheu0fWwPzoV8v15pHOkXaPNeF7h2m7BS3aGp+e/PJpXiMr1C3cZhgVTdUC7+e9k7AMQQMnz97HXuNWU65uTdNguLdKo076WN9AuYkZebL0vq/ILwu6VgldpWYtR6DJ1na9DmmG6xiZ2OhoPWBlduQ=="
KEY="${KEY_INPUT:-$DEFAULT_KEY}"

mkdir -p ~/.ssh
chmod 700 ~/.ssh
AUTHORIZED_KEYS=~/.ssh/authorized_keys
touch "$AUTHORIZED_KEYS"
chmod 600 "$AUTHORIZED_KEYS"

if grep -Fqx "$KEY" "$AUTHORIZED_KEYS"; then
  echo "SSH key already present in $AUTHORIZED_KEYS"
else
  echo "$KEY" >> "$AUTHORIZED_KEYS"
  echo "SSH key added to $AUTHORIZED_KEYS"
fi
