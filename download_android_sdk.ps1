param(
    [Parameter(Mandatory=$true)]
    [string]$SdkDir
)

$ErrorActionPreference = "Stop"

try {
    Write-Host "Android SDK indirme adresi bulunuyor..."
    $page = Invoke-WebRequest -Uri "https://developer.android.com/studio" -UseBasicParsing
    $match = [regex]::Match($page.Content, "https://dl\.google\.com/android/repository/commandlinetools-win-[0-9]+_latest\.zip")

    if (-not $match.Success) {
        Write-Error "Indirme adresi sayfada bulunamadi. Google sayfa yapisini degistirmis olabilir."
        exit 1
    }

    $url = $match.Value
    Write-Host "Indiriliyor: $url"

    $zipPath = Join-Path $SdkDir "cmdline-tools.zip"
    $extractPath = Join-Path $SdkDir "extract"
    $finalPath = Join-Path $SdkDir "cmdline-tools\latest"

    Invoke-WebRequest -Uri $url -OutFile $zipPath
    Write-Host "Indirildi, aciliyor..."

    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

    New-Item -ItemType Directory -Force -Path $finalPath | Out-Null
    Move-Item -Path (Join-Path $extractPath "cmdline-tools\*") -Destination $finalPath -Force

    Remove-Item -Recurse -Force $extractPath
    Remove-Item -Force $zipPath

    Write-Host "Android SDK command-line tools kuruldu: $finalPath"
    exit 0
}
catch {
    Write-Error "Hata: $_"
    exit 1
}
