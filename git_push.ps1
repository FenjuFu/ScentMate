$token = "YOUR_GITHUB_TOKEN"
$username = "FenjuFu"
$repoName = "ScentMate"

git init
git config user.name "FenjuFu"
git config user.email "FenjuFu@users.noreply.github.com"
git add .
git commit -m "Initial commit: ScentMate web project"
git branch -M main

$remoteUrl = "https://${username}:${token}@github.com/${username}/${repoName}.git"
git remote add origin $remoteUrl
git push -u origin main
