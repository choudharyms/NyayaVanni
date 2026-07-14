from backend.services.legal_processor import LegalQueryOptimizer


def test_query_optimizer_preserves_legal_formats():
    optimizer = LegalQueryOptimizer()

    # 1. Test Dates
    assert (
        optimizer.clean_and_expand_query("Notice dated 15/06/2024")
        == "Notice dated 15/06/2024"
    )

    # 2. Test Currency Symbols (₹, $)
    assert (
        optimizer.clean_and_expand_query("A penalty of ₹50,000")
        == "A penalty of ₹50,000"
    )
    assert optimizer.clean_and_expand_query("Amount: $1,250") == "Amount: $1,250"

    # 3. Test Time Values
    assert optimizer.clean_and_expand_query("At 10:30 AM") == "At 10:30 AM"

    # 4. Test Quotes
    assert (
        optimizer.clean_and_expand_query("Under \"Clause 4\" or 'Section 12'")
        == "Under \"Clause 4\" or 'Section 12'"
    )

    # 5. Test Expansion of Legal Abbreviations
    assert (
        optimizer.clean_and_expand_query("IPC Section 420")
        == "Indian Penal Code Section 420"
    )
    assert (
        optimizer.clean_and_expand_query("FIR was filed")
        == "First Information Report was filed"
    )

    # 6. Test Unwanted/Dangerous Characters are still stripped
    assert (
        optimizer.clean_and_expand_query("<script>alert(1)</script>")
        == "scriptalert(1)/script"
    )
    assert (
        optimizer.clean_and_expand_query("injection {override}") == "injection override"
    )
