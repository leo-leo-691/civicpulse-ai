$PROJECT = "geminijournal-507414"
$POOL_NAME = "github-actions-pool"
$PROVIDER_NAME = "github-actions-provider"
$REPO = "leo-leo-691/civicpulse-ai"

gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME `
  --project=$PROJECT `
  --location="global" `
  --workload-identity-pool=$POOL_NAME `
  --display-name="GitHub Actions Provider" `
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" `
  --attribute-condition="assertion.repository == '$REPO'" `
  --issuer-uri="https://token.actions.githubusercontent.com"

gcloud iam workload-identity-pools providers describe $PROVIDER_NAME `
  --project=$PROJECT `
  --location="global" `
  --workload-identity-pool=$POOL_NAME `
  --format="value(name)"
