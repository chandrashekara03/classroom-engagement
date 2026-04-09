param(
  [string]$ProjectId = "classroomengagement-2026",
  [string]$Instance = "classroomengagement-2026-default-rtdb"
)

$ErrorActionPreference = "Stop"
$env:NODE_NO_WARNINGS = "1"

function Invoke-FirebaseGet {
  param([string]$Path)

  $raw = firebase database:get $Path --project $ProjectId --instance $Instance 2>$null
  if (-not $raw) {
    return $null
  }

  $rawText = ($raw | Out-String).Trim()
  if ([string]::IsNullOrWhiteSpace($rawText) -or $rawText -eq "null") {
    return $null
  }

  return $rawText | ConvertFrom-Json
}

function Ensure-Node {
  param(
    [string]$Path,
    [string]$JsonData
  )

  $existing = Invoke-FirebaseGet -Path $Path
  if ($null -ne $existing) {
    Write-Host "- ${Path}: exists"
    return
  }

  $tmp = [System.IO.Path]::GetTempFileName()
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($tmp, $JsonData, $utf8NoBom)

  firebase database:set $Path $tmp --project $ProjectId --instance $Instance -f | Out-Null
  $setExitCode = $LASTEXITCODE

  Remove-Item $tmp -ErrorAction SilentlyContinue

  if ($setExitCode -ne 0) {
    throw "Failed to set path '$Path'."
  }

  Write-Host "- ${Path}: created"
}

Write-Host "Using project: $ProjectId"
Write-Host "Using RTDB instance: $Instance"

$metadataJson = @{
  schemaVersion = 2
  app = "classroom-engagement"
  initializedAt = (Get-Date).ToString("o")
} | ConvertTo-Json -Compress

$roleOptionsJson = @{
  roles = @(
    @{
      value = "admin"
      label = "Admin"
      description = "Can manage users, roles, and admin dashboard settings."
      enabled = $true
    },
    @{
      value = "teacher"
      label = "Teacher"
      description = "Can create activities, sessions, and review classroom analytics."
      enabled = $true
    },
    @{
      value = "student"
      label = "Student"
      description = "Can join sessions and submit activity responses."
      enabled = $true
    }
  )
  departments = @(
    @{ value = "computer-science"; label = "Computer Science" },
    @{ value = "mathematics"; label = "Mathematics" },
    @{ value = "physics"; label = "Physics" },
    @{ value = "commerce"; label = "Commerce" },
    @{ value = "management"; label = "Management" }
  )
  updatedAt = (Get-Date).ToString("o")
} | ConvertTo-Json -Compress

Ensure-Node -Path "/metadata" -JsonData $metadataJson
Ensure-Node -Path "/admins" -JsonData "{}"
Ensure-Node -Path "/teachers" -JsonData "{}"
Ensure-Node -Path "/students" -JsonData "{}"
Ensure-Node -Path "/users" -JsonData "{}"
Ensure-Node -Path "/roleOptions" -JsonData $roleOptionsJson
Ensure-Node -Path "/adminRoleChanges" -JsonData "{}"
Ensure-Node -Path "/sessions" -JsonData "{}"
Ensure-Node -Path "/activityLogs" -JsonData "{}"
Ensure-Node -Path "/responses" -JsonData "{}"
Ensure-Node -Path "/templates" -JsonData "{}"
Ensure-Node -Path "/auditLogs" -JsonData "{}"

Write-Host "Deploying Realtime Database rules..."
firebase deploy --only database --project $ProjectId

Write-Host "RTDB seed and rules deployment completed."