# AI Governance Hub v16.5.2 — Static consistency verification (local files)
# Run from repository root after implementation. Does not hit production.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "=== Version markers (expect v16.5.2) ===" -ForegroundColor Cyan
$versionFiles = @(
  "index.html",
  "pricing.html",
  "starter-success.html",
  "starter-pending.html",
  "assets/js/starter-checkout.js",
  "api/create-order.js",
  "api/verify-payment.js"
)
foreach ($f in $versionFiles) {
  $hit = Select-String -Path $f -Pattern "v16\.5\.2" -Quiet
  Write-Host ("  {0}: {1}" -f $f, $(if ($hit) { "OK" } else { "MISSING" }))
}

Write-Host "`n=== Forbidden patterns (expect zero matches in payment files) ===" -ForegroundColor Cyan
$forbidden = @("499", "30 days", "Starter Launch Edition", "jiraSite", "starter-jira", "starter-company", "RZP_KEY_ID_PLACEHOLDER")
foreach ($pat in $forbidden) {
  $matches = Select-String -Path $versionFiles -Pattern $pat -SimpleMatch
  $count = @($matches).Count
  Write-Host ("  {0}: {1}" -f $pat, $count)
}

Write-Host "`n=== Required patterns ===" -ForegroundColor Cyan
$required = @{
  "index.html" = @("₹199", "One AI Governance Starter Report", "Introductory Offer")
  "pricing.html" = @("data-starter-scroll-checkout", "data-starter-checkout", "starter-buyer-company", "₹199")
  "assets/js/starter-checkout.js" = @("data-starter-scroll-checkout", "starter-buyer-company", "confirmationToken", "VERIFY_PAYMENT_URL")
  "starter-success.html" = @("success-unverified", "success-verified", "confirmationToken")
  "starter-pending.html" = @("Retry Payment", "starter-checkout-form", "Return Home")
  "api/create-order.js" = @("19900", "One AI Governance Starter Report", "trimEnv")
  "api/verify-payment.js" = @("confirmationToken", "timingSafeEqual")
}
foreach ($file in $required.Keys) {
  foreach ($pat in $required[$file]) {
    $ok = Select-String -Path $file -Pattern $pat -Quiet
    Write-Host ("  {0} contains '{1}': {2}" -f $file, $pat, $(if ($ok) { "OK" } else { "MISSING" }))
  }
}

Write-Host "`n=== HTML/JS ID alignment ===" -ForegroundColor Cyan
$htmlIds = Select-String -Path "pricing.html" -Pattern 'id="starter-buyer-[^"]+"' -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Value }
$jsIds = @("starter-buyer-name", "starter-buyer-email", "starter-buyer-company")
foreach ($id in $jsIds) {
  $inHtml = Select-String -Path "pricing.html" -Pattern $id -Quiet
  $inJs = Select-String -Path "assets/js/starter-checkout.js" -Pattern $id -Quiet
  Write-Host ("  {0}: HTML={1} JS={2}" -f $id, $inHtml, $inJs)
}

Write-Host "`nDone." -ForegroundColor Green
