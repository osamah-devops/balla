locals {
  frontend_domain = "www.marmil.co"
}

data "aws_route53_zone" "primary" {
  zone_id = "Z06560653HHLUZYIU86O4"
}

# CloudFront requires the certificate in us-east-1; the whole provider already targets
# us-east-1 (see providers.tf), so no aliased provider is needed here.
resource "aws_acm_certificate" "frontend" {
  domain_name       = local.frontend_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.tags
}

resource "aws_route53_record" "frontend_cert_validation" {
  for_each = {
    for option in aws_acm_certificate.frontend.domain_validation_options : option.domain_name => {
      name  = option.resource_record_name
      type  = option.resource_record_type
      value = option.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.primary.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "frontend" {
  certificate_arn         = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [for record in aws_route53_record.frontend_cert_validation : record.fqdn]
}

resource "aws_route53_record" "frontend_alias_a" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = local.frontend_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_alias_aaaa" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = local.frontend_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
