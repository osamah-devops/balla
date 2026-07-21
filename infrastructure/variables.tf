variable "api_container_port" {
  description = "Port the .NET API container listens on inside the ECS task"
  type        = number
  default     = 8080
}

variable "stripe_secret_key" {
  description = "Stripe secret key (test or live) for creating Checkout Sessions. Supply via -var or a gitignored *.tfvars file, never commit."
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret for verifying checkout.session.completed events. Supply via -var or a gitignored *.tfvars file, never commit."
  type        = string
  sensitive   = true
}
