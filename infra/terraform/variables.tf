variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.large"
}

variable "api_replicas" {
  description = "Number of API replicas"
  type        = number
  default     = 3
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "Infamous Freight"
}
