# Enterprise AWS multi-region edge resources

variable "aws_primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

provider "aws" {
  alias  = "primary"
  region = var.aws_primary_region
}

provider "aws" {
  alias  = "secondary"
  region = var.aws_secondary_region
}

resource "aws_lb" "freight_lb" {
  provider           = aws.primary
  name               = "freight-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_lb.freight_lb.dns_name
    origin_id   = "freight-lb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "freight-lb-origin"

    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

variable "public_subnet_ids" {
  description = "Public subnet IDs used by ALB"
  type        = list(string)
}
