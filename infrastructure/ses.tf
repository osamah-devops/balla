locals {
  ses_domain = "mail.${trimprefix(local.frontend_domain, "www.")}"
}

resource "aws_ses_domain_identity" "notifications" {
  domain = local.ses_domain
}

resource "aws_route53_record" "ses_verification" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = "_amazonses.${aws_ses_domain_identity.notifications.domain}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.notifications.verification_token]
}

resource "aws_ses_domain_identity_verification" "notifications" {
  domain     = aws_ses_domain_identity.notifications.id
  depends_on = [aws_route53_record.ses_verification]
}

resource "aws_ses_domain_dkim" "notifications" {
  domain = aws_ses_domain_identity.notifications.domain
}

resource "aws_route53_record" "ses_dkim" {
  # AWS always issues exactly 3 DKIM tokens; the count is static even though the
  # token values themselves aren't known until apply, which for_each can't express.
  count = 3

  zone_id = data.aws_route53_zone.primary.zone_id
  name    = "${aws_ses_domain_dkim.notifications.dkim_tokens[count.index]}._domainkey.${aws_ses_domain_identity.notifications.domain}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.notifications.dkim_tokens[count.index]}.dkim.amazonses.com"]
}
