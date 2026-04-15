$paths = @(
  "src/pages/dashboards/owner/DashboardHome.tsx",
  "src/components/AIDashboard.tsx",
  "src/components/AuthErrorFallback.tsx",
  "src/components/waitlist/WaitlistEntryModal.tsx",
  "src/components/waitlist/ProfessionalWaitlistPanel.tsx",
  "src/components/waitlist/AgendaIntelligencePanel.tsx",
  "src/components/automation/AutomationSettingsPanel.tsx",
  "src/components/whatsapp/WhatsAppMonitoringPanel.tsx",
  "src/components/shared/ReportsPanel.tsx",
  "src/components/fiscal/FiscalAutomationPanel.tsx",
  "src/components/contabilidade/PedidoContabilPanel.tsx",
  "src/components/automation/SmartMessagingPanel.tsx",
  "src/pages/super-admin/PartnersPage.tsx",
  "src/pages/super-admin/PartnersDashboard.tsx",
  "src/pages/admin/CommissionsPage.tsx",
  "src/pages/dashboard/FinanceDashboard.tsx"
)

$replacements = @(
  @("bg-blue-600", "bg-orange-500"),
  @("bg-blue-700", "bg-orange-600"),
  @("bg-blue-500", "bg-orange-400"),
  @("bg-blue-400", "bg-orange-300"),
  @("bg-blue-200", "bg-orange-200"),
  @("bg-blue-100", "bg-orange-100"),
  @("bg-blue-50", "bg-orange-50"),
  @("text-blue-900", "text-slate-900"),
  @("text-blue-800", "text-slate-800"),
  @("text-blue-700", "text-orange-700"),
  @("text-blue-600", "text-orange-600"),
  @("text-blue-500", "text-orange-500"),
  @("text-blue-400", "text-orange-400"),
  @("text-blue-300", "text-orange-300"),
  @("border-blue-600", "border-orange-500"),
  @("border-blue-500", "border-orange-400"),
  @("border-blue-400", "border-orange-300"),
  @("border-blue-200", "border-orange-200"),
  @("border-blue-100", "border-orange-100"),
  @("hover:bg-blue-600", "hover:bg-orange-600"),
  @("hover:bg-blue-700", "hover:bg-orange-700"),
  @("hover:text-blue-600", "hover:text-orange-600"),
  @("group-hover:text-blue-600", "group-hover:text-orange-500"),
  @("blue-500/10", "orange-500/10"),
  @("blue-500/20", "orange-500/20"),
  @("blue-500/30", "orange-500/30"),
  @("blue-600/10", "orange-500/10"),
  @("indigo-500", "orange-500"),
  @("indigo-600", "orange-500"),
  @("indigo-400", "orange-400"),
  @("cyan-400", "orange-400"),
  @("cyan-300", "orange-300")
)

foreach ($path in $paths) {
  if (Test-Path $path) {
    $content = [System.IO.File]::ReadAllText($path)
    foreach ($pair in $replacements) {
      $content = $content.Replace($pair[0], $pair[1])
    }
    [System.IO.File]::WriteAllText($path, $content)
    Write-Host "OK: $path"
  } else {
    Write-Host "SKIP: $path"
  }
}
Write-Host "Done."
