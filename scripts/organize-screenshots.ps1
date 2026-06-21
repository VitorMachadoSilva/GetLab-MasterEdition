$ErrorActionPreference = 'Stop'

$root = Resolve-Path -LiteralPath 'test-results\visual'

$moves = @(
  @{ Source = '01-redirect-login.png'; Target = 'auth\login\redirect-login.png' },
  @{ Source = '02-display-public.png'; Target = 'display\publico\display-public.png' },
  @{ Source = '03-admin-dashboard.png'; Target = 'admin\reservas\dashboard.png' },
  @{ Source = '04-admin-panel.png'; Target = 'admin\reservas\painel-admin.png' },
  @{ Source = '05-admin-salas.png'; Target = 'admin\salas\lista-inicial.png' },
  @{ Source = '06-professor-admin-redirect.png'; Target = 'auth\authorization\professor-admin-redirect.png' },
  @{ Source = '07-professor-nova-reserva-agenda.png'; Target = 'professor\nova-reserva\agenda.png' },
  @{ Source = '08-professor-minhas-reservas.png'; Target = 'professor\minhas-reservas\lista.png' },
  @{ Source = '09-mobile-nova-reserva-agenda.png'; Target = 'professor\nova-reserva\mobile-agenda.png' },
  @{ Source = '10-admin-usuarios.png'; Target = 'admin\usuarios\lista-antiga.png' },
  @{ Source = '11-admin-usuarios-modal.png'; Target = 'admin\usuarios\modal-antigo.png' },
  @{ Source = '12-admin-salas.png'; Target = 'admin\salas\lista.png' },
  @{ Source = '13-admin-salas-modal.png'; Target = 'admin\salas\modal.png' },
  @{ Source = '14-professor-agenda-ocupada.png'; Target = 'professor\nova-reserva\agenda-ocupada.png' },
  @{ Source = '15-mobile-dashboard-viewport.png'; Target = 'dashboard\mobile-viewport.png' },
  @{ Source = '16-mobile-minhas-reservas-viewport.png'; Target = 'professor\minhas-reservas\mobile-viewport.png' },
  @{ Source = 'admin-pendentes-paginacao-mobile.png'; Target = 'admin\reservas\pendentes-paginacao-mobile.png' },
  @{ Source = 'admin-pendentes-paginacao.png'; Target = 'admin\reservas\pendentes-paginacao.png' },
  @{ Source = 'admin-reservas-fluxo.png'; Target = 'admin\reservas\fluxo.png' },
  @{ Source = 'admin-reservas-rejeicao-modal.png'; Target = 'admin\reservas\rejeicao-modal.png' },
  @{ Source = 'admin-salas-modal-chips.png'; Target = 'admin\salas\modal-chips.png' },
  @{ Source = 'admin-usuarios-mobile.png'; Target = 'admin\usuarios\mobile.png' },
  @{ Source = 'admin-usuarios-modal.png'; Target = 'admin\usuarios\modal.png' },
  @{ Source = 'admin-usuarios.png'; Target = 'admin\usuarios\lista.png' },
  @{ Source = 'nova-reserva-disponibilidade-mobile.png'; Target = 'professor\nova-reserva\disponibilidade-mobile.png' },
  @{ Source = 'nova-reserva-disponibilidade.png'; Target = 'professor\nova-reserva\disponibilidade.png' },
  @{ Source = 'perfil-professor.png'; Target = 'perfil\professor\perfil.png' },
  @{ Source = 'professor-admin-404.png'; Target = 'auth\authorization\professor-admin-404.png' },
  @{ Source = 'professor-login-dashboard.png'; Target = 'auth\login\professor-dashboard.png' },
  @{ Source = 'professor-login-nova-reserva.png'; Target = 'auth\login\professor-nova-reserva.png' }
)

foreach ($move in $moves) {
  $source = Join-Path $root $move.Source
  $target = Join-Path $root $move.Target
  $targetDir = Split-Path -Parent $target

  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

  if (Test-Path -LiteralPath $source) {
    Move-Item -LiteralPath $source -Destination $target -Force
  }
}

Get-ChildItem -Recurse -File -Path $root | Select-Object -ExpandProperty FullName
