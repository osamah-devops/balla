variable "api_container_port" {
  description = "Port the .NET API container listens on inside the ECS task"
  type        = number
  default     = 8080
}
