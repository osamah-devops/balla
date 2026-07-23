locals {
  github_repo = "osamah-devops/balla"
}

# GitHub's OIDC discovery document is what IAM actually validates against; the
# thumbprint below is only a legacy fallback requirement of the API.
data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]

  tags = local.tags
}

# Assumed by pull_request workflows to run `terraform plan`. Read-only, plus
# just enough S3 access to take/release the state lock (terraform plan still
# locks the state by default).
resource "aws_iam_role" "github_actions_plan" {
  name = "${local.name}-gha-plan"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${local.github_repo}:*"
          }
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "github_actions_plan_readonly" {
  role       = aws_iam_role.github_actions_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy" "github_actions_plan_state_lock" {
  name = "${local.name}-gha-plan-state-lock"
  role = aws_iam_role.github_actions_plan.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["s3:PutObject", "s3:DeleteObject"]
        Effect   = "Allow"
        Resource = "arn:aws:s3:::balla-tfstate-072754096540/*"
      }
    ]
  })
}

# Assumed by main-branch workflows to run `terraform apply`, push images to
# ECR, and deploy the frontend/backend. Terraform manages IAM roles/policies
# for itself (this file included), so the role needs broad account access;
# the trust condition restricts it to pushes on main from this exact repo, so
# no PR or fork can assume it.
resource "aws_iam_role" "github_actions_deploy" {
  name = "${local.name}-gha-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
            "token.actions.githubusercontent.com:sub" = "repo:${local.github_repo}:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "github_actions_deploy_admin" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

output "github_actions_plan_role_arn" {
  value = aws_iam_role.github_actions_plan.arn
}

output "github_actions_deploy_role_arn" {
  value = aws_iam_role.github_actions_deploy.arn
}