from shared.repo_tools import classify_changed_files, detect_docs_needed


def test_classify_changed_files():
    files = [
        {'filename': 'app/service.py'},
        {'filename': 'tests/test_service.py'},
        {'filename': 'README.md'},
        {'filename': '.github/workflows/ci.yml'},
        {'filename': 'assets/logo.png'},
    ]
    result = classify_changed_files(files)
    assert result == {'code': 1, 'tests': 1, 'docs': 1, 'infra': 1, 'other': 1}


def test_detect_docs_needed_when_code_changes_without_docs():
    files = [
        {'filename': 'src/api/routes/orders.py'},
        {'filename': 'src/services/billing.py'},
    ]
    assert detect_docs_needed(files) is True


def test_detect_docs_not_needed_when_only_tests_change():
    files = [
        {'filename': 'tests/test_orders.py'},
    ]
    assert detect_docs_needed(files) is False


def test_detect_docs_needed_for_top_level_api_paths():
    files = [
        {'filename': 'api/orders.py'},
        {'filename': 'routes/shipments.py'},
    ]
    assert detect_docs_needed(files) is True
