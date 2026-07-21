resource "aws_dynamodb_table" "users" {
  name         = "${local.name}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "UserId"

  attribute {
    name = "UserId"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "products" {
  name         = "${local.name}-products"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "owners" {
  name         = "${local.name}-owners"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "comments" {
  name         = "${local.name}-comments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ProductId"
  range_key    = "CommentId"

  attribute {
    name = "ProductId"
    type = "S"
  }

  attribute {
    name = "CommentId"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "ratings" {
  name         = "${local.name}-ratings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ProductId"
  range_key    = "UserId"

  attribute {
    name = "ProductId"
    type = "S"
  }

  attribute {
    name = "UserId"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "conversations" {
  name         = "${local.name}-conversations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ConversationId"

  attribute {
    name = "ConversationId"
    type = "S"
  }

  attribute {
    name = "BuyerId"
    type = "S"
  }

  attribute {
    name = "SellerId"
    type = "S"
  }

  attribute {
    name = "LastMessageAt"
    type = "S"
  }

  global_secondary_index {
    name            = "buyer-index"
    hash_key        = "BuyerId"
    range_key       = "LastMessageAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "seller-index"
    hash_key        = "SellerId"
    range_key       = "LastMessageAt"
    projection_type = "ALL"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "conversation_messages" {
  name         = "${local.name}-conversation-messages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ConversationId"
  range_key    = "MessageId"

  attribute {
    name = "ConversationId"
    type = "S"
  }

  attribute {
    name = "MessageId"
    type = "S"
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "notifications" {
  name         = "${local.name}-notifications"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "RecipientId"
  range_key    = "NotificationId"

  attribute {
    name = "RecipientId"
    type = "S"
  }

  attribute {
    name = "NotificationId"
    type = "S"
  }

  ttl {
    attribute_name = "ExpiresAt"
    enabled        = true
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "offers" {
  name         = "${local.name}-offers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "SellerId"
  range_key    = "OfferId"

  attribute {
    name = "SellerId"
    type = "S"
  }

  attribute {
    name = "OfferId"
    type = "S"
  }

  tags = local.tags
}

module "uploads_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket_prefix = "${local.name}-uploads-"
  force_destroy = true

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  tags = local.tags
}

resource "aws_cloudfront_origin_access_control" "uploads" {
  name                              = "${local.name}-uploads-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "uploads_bucket_policy" {
  statement {
    sid     = "AllowCloudFrontServicePrincipal"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = ["${module.uploads_bucket.s3_bucket_arn}/*"]

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

resource "aws_s3_bucket_policy" "uploads" {
  bucket = module.uploads_bucket.s3_bucket_id
  policy = data.aws_iam_policy_document.uploads_bucket_policy.json
}
