module "frontend_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket_prefix = "${local.name}-frontend-"
  force_destroy = true

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  tags = local.tags
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name}-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Rewrites Angular client-side routes to index.html at the edge, before they
# ever reach S3. Replaces the old distribution-wide custom_error_response
# 403/404 -> index.html mapping, which incorrectly also rewrote real 404s
# from the /api/* behavior (ALB origin) into fake 200 HTML responses.
resource "aws_cloudfront_function" "spa_routing" {
  name    = "${local.name}-spa-routing"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite unknown non-file paths to index.html for Angular client-side routing"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var uri = request.uri;

      if (!uri.includes('.')) {
        request.uri = '/index.html';
      }

      return request;
    }
  EOT
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name              = module.frontend_bucket.s3_bucket_bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  origin {
    domain_name = aws_lb.api.dns_name
    origin_id   = "alb-api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name              = module.uploads_bucket.s3_bucket_bucket_regional_domain_name
    origin_id                = "s3-uploads"
    origin_access_control_id = aws_cloudfront_origin_access_control.uploads.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Frontend distribution for ${local.name}"
  default_root_object = "index.html"
  aliases             = [local.frontend_domain, local.frontend_apex_domain]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-frontend"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_routing.arn
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    target_origin_id = "alb-api"

    allowed_methods = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Accept"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    viewer_protocol_policy = "https-only"
  }

  ordered_cache_behavior {
    path_pattern     = "/uploads/*"
    target_origin_id = "s3-uploads"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 604800
    viewer_protocol_policy = "https-only"
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.frontend.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = local.tags
}

data "aws_iam_policy_document" "frontend_bucket_policy" {
  statement {
    sid     = "AllowCloudFrontServicePrincipal"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = ["${module.frontend_bucket.s3_bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = module.frontend_bucket.s3_bucket_id
  policy = data.aws_iam_policy_document.frontend_bucket_policy.json
}
