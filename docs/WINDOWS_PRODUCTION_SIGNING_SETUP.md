# Windows production MSIX signing setup

The project now has a separate workflow:

`.github/workflows/build-liquid-glass-studio-msix-production.yml`

It builds the Windows MSIX and signs it with Azure Artifact Signing using GitHub Actions OIDC. The existing green Windows MSIX workflow is not replaced.

## Azure setup required once

1. Create an Azure subscription and an Azure Artifact Signing account.
2. Create a certificate profile for the publisher identity.
3. The certificate profile Subject name must exactly match the MSIX manifest Publisher value. The current manifest value is `CN=Liquid Glass Studio`. Microsoft requires an exact publisher/subject match, including distinguished-name fields.
4. Create an Entra application/service principal for GitHub Actions and configure a federated credential for this repository and branch.
5. Grant that identity the `Artifact Signing Certificate Profile Signer` role for the certificate profile.
6. Record the Artifact Signing endpoint, account name, and certificate profile name.

## GitHub Actions secrets

Add these repository secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_ARTIFACT_SIGNING_ENDPOINT`
- `AZURE_ARTIFACT_SIGNING_ACCOUNT`
- `AZURE_ARTIFACT_SIGNING_PROFILE`

Do not commit Azure credentials or signing keys to the repository.

## Run

After the Azure setup and secrets are complete:

GitHub → Actions → `Build Liquid Glass Studio MSIX PRODUCTION` → `Run workflow`

A successful run uploads `liquid-glass-studio-msix-production` containing `Liquid Glass Studio.msix`.

The existing website features and existing Windows packaging workflow are preserved under the additive-only project rule.
