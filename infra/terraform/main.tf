/**
 * Terraform Infrastructure-as-Code Configuration
 * Deploy Infamous Freight to Fly.io with Terraform
 * Enables version control, reproducibility, and team collaboration
 */

# Define the Terraform version
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    fly = {
      source  = "fly-apps/fly"
      version = "~> 0.1"
    }
  }

  # Backend configuration for state management
  backend "remote" {
    organization = "infamous-freight"
    
    workspaces {
      name = "production"
    }
  }
}

provider "fly" {
  api_token = var.fly_api_token
}

# Variables
variable "fly_api_token" {
  description = "Fly.io API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "api_image" {
  description = "Docker image for API"
  type        = string
  default     = "infamous-freight:api-latest"
}

variable "regions" {
  description = "Regions to deploy to"
  type        = list(string)
  default     = ["iad", "dfw", "sea", "lax", "cdg", "ord"]
}

variable "machine_cpus" {
  description = "Number of CPUs per machine"
  type        = number
  default     = 1
}

variable "machine_memory" {
  description = "Memory per machine in MB"
  type        = number
  default     = 1024
}

variable "machine_count" {
  description = "Number of machines per region"
  type        = number
  default     = 2
}

# Fly App
resource "fly_app" "api" {
  name = "infamous-freight-api"
  org  = var.environment

  lifecycle {
    prevent_destroy = true
  }
}

# PostgreSQL Database
resource "fly_app" "database" {
  name = "infamous-freight-db"
  org  = var.environment

  lifecycle {
    prevent_destroy = true
  }
}

# Redis Cache
resource "fly_app" "redis" {
  name = "infamous-freight-redis"
  org  = var.environment
}

# Machines for API (distributed across regions)
resource "fly_machine" "api" {
  count = length(var.regions) * var.machine_count

  app    = fly_app.api.name
  region = var.regions[count.index % length(var.regions)]

  image = var.api_image

  cpus      = var.machine_cpus
  memory_mb = var.machine_memory

  # Environment variables
  env = {
    NODE_ENV                          = var.environment
    PORT                              = "4000"
    DATABASE_URL                      = "postgresql://..."
    REDIS_URL                         = "redis://..."
    JWT_SECRET                        = var.jwt_secret
    AI_PROVIDER                       = "openai"
    ENABLE_BROTLI                     = "true"
    DATABASE_POOL_SIZE                = "50"
    WEBSOCKET_HEARTBEAT_INTERVAL      = "30000"
    SENTRY_ENABLED                    = "true"
    OTEL_ENABLED                      = "true"
    LOG_LEVEL                         = "info"
  }

  # Volumes for persistence
  volumes = [
    {
      name        = "data"
      destination = "/data"
      size_gb     = 10
    }
  ]

  # Health check
  http_check = {
    path           = "/api/health"
    interval       = 10
    timeout        = 5
    grace_period   = 30
  }

  # Restart policy
  restart_policy = {
    max_retries = 5
  }

  depends_on = [fly_app.api, fly_app.database, fly_app.redis]
}

# Autoscaling policy
resource "fly_scale" "api" {
  app  = fly_app.api.name

  # Min/max machines per region
  min_machines_running = 1
  max_machines_running = 10

  # Scale up when memory > 80%
  memory_threshold = 80

  # Scale up when CPU > 80%
  cpu_threshold = 80
}

# Outputs
output "api_app_name" {
  description = "API app name"
  value       = fly_app.api.name
}

output "api_machines" {
  description = "API machine details"
  value       = [for m in fly_machine.api : {
    id     = m.id
    region = m.region
    image  = m.image
  }]
}

output "database_connection_string" {
  description = "Database connection string"
  value       = "postgresql://user:pass@infamous-freight-db.internal:5432/infamous_freight"
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = "redis://infamous-freight-redis.internal:6379"
  sensitive   = true
}

/**
 * Usage:
 *
 * # Initialize Terraform
 * terraform init
 *
 * # Plan deployment (dry-run)
 * terraform plan
 *
 * # Apply changes
 * terraform apply
 *
 * # View infrastructure
 * terraform show
 *
 * # Update variable
 * terraform apply -var="machine_count=3"
 *
 * # Destroy infrastructure (careful!)
 * terraform destroy
 *
 * Environment file (terraform.tfvars):
 * fly_api_token = "FlyV1 ..."
 * environment   = "production"
 * machine_count = 3
 * regions       = ["iad", "dfw", "sea", "lax"]
 *
 * Benefits:
 * - Infrastructure as code (version controlled)
 * - Reproducible deployments
 * - Team collaboration
 * - Change tracking (terraform plan)
 * - Easy rollback (terraform destroy/apply)
 * - CI/CD integration
 */
