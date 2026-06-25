from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
MP = "https://marketplace.atlassian.com/apps/3237155442/ai-governance-hub?hosting=cloud&tab=overview"

OLD_ROOT = """        <a href="index.html#platform">Platform</a>
        <a href="assessment.html">Assessment</a>
        <a href="index.html#pricing">Pricing</a>
        <a href="docs/index.html">Documentation</a>
        <a href="support.html">Support</a>
        <a href="security-policy.html">Security</a>
        <a class="nav-cta" href="index.html#contact">Book Demo</a>"""

NEW_ROOT = f"""        <a href="index.html#platform">Platform</a>
        <a href="index.html#frameworks">Frameworks</a>
        <a href="docs/index.html">Documentation</a>
        <a href="support.html">Support</a>
        <a href="security-policy.html">Security</a>
        <a class="nav-cta" href="{MP}" target="_blank" rel="noopener noreferrer">Install from Marketplace</a>"""

OLD_DOCS = """        <a href="../index.html#platform">Platform</a>
        <a href="../assessment.html">Assessment</a>
        <a href="../index.html#pricing">Pricing</a>
        <a href="index.html">Documentation</a>
        <a href="../support.html">Support</a>
        <a href="../security-policy.html">Security</a>
        <a class="nav-cta" href="../index.html#contact">Book Demo</a>"""

NEW_DOCS = f"""        <a href="../index.html#platform">Platform</a>
        <a href="../index.html#frameworks">Frameworks</a>
        <a href="index.html">Documentation</a>
        <a href="../support.html">Support</a>
        <a href="../security-policy.html">Security</a>
        <a class="nav-cta" href="{MP}" target="_blank" rel="noopener noreferrer">Install from Marketplace</a>"""

for path in BASE.rglob("*.html"):
    if path.name == "unavailable-page-template.html":
        continue
    text = path.read_text(encoding="utf-8")
    original = text
    if "docs" in path.parts:
        text = text.replace(OLD_DOCS, NEW_DOCS)
    else:
        text = text.replace(OLD_ROOT, NEW_ROOT)
    text = text.replace('        <a href="sample-report.html">Sample Report</a>\n', "")
    text = text.replace('        <a href="../sample-report.html">Sample Report</a>\n', "")
    text = text.replace(
        '<a class="primary-blue-btn" href="assessment.html">Start AI Governance Assessment</a>',
        f'<a class="primary-blue-btn" href="{MP}" target="_blank" rel="noopener noreferrer">Install from Atlassian Marketplace</a>',
    )
    text = text.replace("marketplace-approval-v15", "marketplace-alignment-v16.2")
    text = text.replace("marketplace-first-v16.1", "marketplace-alignment-v16.2")
    text = text.replace("day100-instant-report-v1", "marketplace-alignment-v16.2")
    text = text.replace("v16.0.1-razorpay", "marketplace-alignment-v16.2")
    text = text.replace(
        "Available on Jira Cloud. Built on Atlassian Forge.",
        "Available on Atlassian Marketplace for Jira Cloud. Built on Atlassian Forge.",
    )
    if text != original:
        path.write_text(text, encoding="utf-8", newline="\n")
        print(f"updated {path.relative_to(BASE)}")
