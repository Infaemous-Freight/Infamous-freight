# @compliance

## Purpose
Canonical compliance code domain.

## Owns
- compliance rules
- compliance schemas
- compliance APIs
- reusable compliance validation logic

## Does not own
- legacy/transitional content in `compliance/`
- security response policy docs in `.security/`

## Runbook / entrypoints
- import as internal compliance domain package/module
- wire through app/service APIs as needed

## Owner
Compliance Engineering
