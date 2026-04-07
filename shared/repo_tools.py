def is_test_file(path):
    lower = path.lower()
    return 'test' in lower or 'spec' in lower or '__tests__' in lower


def is_doc_file(path):
    lower = path.lower()
    return lower.startswith('docs/') or 'readme' in lower or 'changelog' in lower or lower.endswith('.md')


def is_code_file(path):
    return path.lower().endswith(('.py', '.ts', '.tsx', '.js', '.jsx', '.go', '.java', '.rb', '.php', '.rs', '.c', '.cpp', '.h', '.hpp', '.cs', '.scala', '.kt', '.swift', '.sql', '.sh', '.yaml', '.yml', '.json'))


def classify_changed_files(files):
    result = {'code': 0, 'tests': 0, 'docs': 0, 'infra': 0, 'other': 0}
    for item in files:
        path = item.get('filename', '')
        lower = path.lower()
        if is_test_file(path):
            result['tests'] += 1
        elif is_doc_file(path):
            result['docs'] += 1
        elif lower.startswith(('.github/', 'terraform/', 'infra/', 'helm/', 'k8s/')):
            result['infra'] += 1
        elif is_code_file(path):
            result['code'] += 1
        else:
            result['other'] += 1
    return result


def detect_docs_needed(files):
    has_code = any(is_code_file(item.get('filename', '')) and not is_test_file(item.get('filename', '')) for item in files)
    has_docs = any(is_doc_file(item.get('filename', '')) for item in files)
    touches_api = any('/api/' in item.get('filename', '').lower() or '/routes/' in item.get('filename', '').lower() or item.get('filename', '').lower().endswith(('openapi.yaml', 'openapi.yml', 'swagger.json')) for item in files)
    return has_code and (not has_docs or touches_api)


def summarize_check_runs(check_runs):
    if not check_runs:
        return 'No check runs found.'
    rows = []
    for item in check_runs[:12]:
        rows.append(f"- {item.get('name', 'unknown')}: {item.get('status', 'unknown')}/{item.get('conclusion') or 'pending'}")
    if len(check_runs) > 12:
        rows.append(f"- ... {len(check_runs) - 12} more checks omitted")
    return '\n'.join(rows)


def build_pr_context(files, max_files, max_patch_chars):
    chunks = []
    for item in files[:max_files]:
        patch = item.get('patch', '')
        if len(patch) > max_patch_chars:
            patch = patch[: max(max_patch_chars - 3, 0)] + '...'
        chunks.append('\n'.join([
            f"FILE: {item.get('filename', '')}",
            f"STATUS: {item.get('status', 'modified')}",
            f"ADDITIONS: {item.get('additions', 0)}",
            f"DELETIONS: {item.get('deletions', 0)}",
            'PATCH:',
            patch or '<no patch available>',
        ]))
    if len(files) > max_files:
        chunks.append(f'... {len(files) - max_files} files omitted for token control')
    return '\n\n---\n\n'.join(chunks)


def build_issue_keywords(title):
    words = [w for w in title.lower().replace('/', ' ').replace('-', ' ').split() if len(w) > 2]
    stop = {'the', 'and', 'for', 'with', 'that', 'from', 'this', 'when', 'into', 'your', 'have', 'has', 'are', 'not', 'bug', 'issue', 'error'}
    return ' '.join([w for w in words if w not in stop][:6])


def format_bullets(items, empty_text='None.'):
    if not items:
        return empty_text
    return '\n'.join(f'- {item}' for item in items)
