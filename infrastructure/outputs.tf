output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.app_users.id
}

output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.app_users.id
}

output "frontend_bucket_name" {
  value = module.frontend_bucket.s3_bucket_id
}

output "frontend_url" {
  value = "https://${local.frontend_domain}"
}

output "frontend_cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "api_url" {
  value = "http://${aws_lb.api.dns_name}"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "uploads_bucket_name" {
  value = module.uploads_bucket.s3_bucket_id
}

output "dynamodb_users_table_name" {
  value = aws_dynamodb_table.users.name
}

output "dynamodb_products_table_name" {
  value = aws_dynamodb_table.products.name
}

output "dynamodb_owners_table_name" {
  value = aws_dynamodb_table.owners.name
}

output "dynamodb_comments_table_name" {
  value = aws_dynamodb_table.comments.name
}

output "dynamodb_ratings_table_name" {
  value = aws_dynamodb_table.ratings.name
}

output "dynamodb_conversations_table_name" {
  value = aws_dynamodb_table.conversations.name
}

output "dynamodb_conversation_messages_table_name" {
  value = aws_dynamodb_table.conversation_messages.name
}

output "dynamodb_notifications_table_name" {
  value = aws_dynamodb_table.notifications.name
}

output "dynamodb_offers_table_name" {
  value = aws_dynamodb_table.offers.name
}
