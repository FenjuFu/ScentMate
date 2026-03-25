$token = "YOUR_GITHUB_TOKEN"
$headers = @{ Authorization = "token $token" }
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
    Write-Output "Username: $($user.login)"
    
    $repoName = "ScentMate"
    $body = @{
        name = $repoName
        description = "气味相投 - ScentMate"
        private = $false
    } | ConvertTo-Json
    
    $repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body
    Write-Output "Repo created: $($repo.html_url)"
} catch {
    Write-Error "Error: $_"
}
