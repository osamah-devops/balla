terraform {
  required_version = ">= 1.15"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.38"
    }
  }

  # Bootstrapped outside this config (see infrastructure/README) to avoid the
  # chicken-and-egg problem of Terraform managing its own state backend.
  backend "s3" {
    bucket       = "balla-tfstate-072754096540"
    key          = "balla/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
