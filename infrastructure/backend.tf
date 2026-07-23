resource "aws_ecr_repository" "api" {
  name                 = "${local.name}-api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.name}-api"
  retention_in_days = 30

  tags = local.tags
}

resource "aws_ecs_cluster" "main" {
  name = "${local.name}-ecs-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = local.tags
}

resource "aws_security_group" "alb" {
  name_prefix = "${local.name}-alb-"
  description = "Security group for the API load balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP from the internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_security_group" "ecs" {
  name_prefix = "${local.name}-ecs-"
  description = "Security group for ECS managed instances / tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "API traffic from the load balancer"
    from_port       = var.api_container_port
    to_port         = var.api_container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_lb" "api" {
  name               = "${local.name}-api-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  # SignalR keeps long-lived WebSocket connections open; the default 60s idle
  # timeout is uncomfortably close to the client's keepalive interval.
  idle_timeout = 120

  tags = local.tags
}

resource "aws_lb_target_group" "api" {
  name        = "${local.name}-api-tg"
  port        = var.api_container_port
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    interval            = 30
    timeout             = 5
    matcher             = "200"
  }

  # SignalR connections are stateful and stick to whichever instance accepted
  # them; only matters once desired_count > 1, but costs nothing to set now.
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 3600
    enabled         = true
  }

  tags = local.tags
}

resource "aws_lb_listener" "api_http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_iam_role" "ecs_instance" {
  name = "${local.name}-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_instance_ssm" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ecs_instance_managed_instances" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECSInstanceRolePolicyForManagedInstances"
}

resource "aws_iam_instance_profile" "ecs_instance" {
  name_prefix = "${local.name}-ecs-instance-"
  role        = aws_iam_role.ecs_instance.name
}

resource "aws_ecs_capacity_provider" "main" {
  name    = "${local.name}-capacity-provider"
  cluster = aws_ecs_cluster.main.name

  managed_instances_provider {
    infrastructure_role_arn = aws_iam_role.ecs_infrastructure.arn
    propagate_tags          = "CAPACITY_PROVIDER"

    instance_launch_template {
      ec2_instance_profile_arn = aws_iam_instance_profile.ecs_instance.arn
      monitoring               = "DETAILED"

      network_configuration {
        subnets         = module.vpc.private_subnets
        security_groups = [aws_security_group.ecs.id]
      }

      storage_configuration {
        storage_size_gib = 30
      }

      instance_requirements {
        memory_mib {
          min = 1024
          max = 8192
        }

        vcpu_count {
          min = 1
          max = 4
        }

        instance_generations = ["current"]
        cpu_manufacturers    = ["intel", "amd"]
      }
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = [aws_ecs_capacity_provider.main.name]

  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.main.name
    weight            = 1
  }
}

resource "aws_iam_role" "ecs_infrastructure" {
  name = "${local.name}-ecs-infrastructure-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_infrastructure_managed_instances" {
  role       = aws_iam_role.ecs_infrastructure.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECSInfrastructureRolePolicyForManagedInstances"
}

# The AWS-managed policy above scopes iam:PassRole to role names matching "ecsInstanceRole*",
# which ours (${local.name}-ecs-instance-role) doesn't match, so it's granted explicitly here.
resource "aws_iam_policy" "ecs_infrastructure" {
  name        = "${local.name}-ecs-infrastructure-policy"
  description = "Grants the ECS infrastructure role permission to pass our EC2 instance role to Managed Instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "iam:PassRole"
        Effect   = "Allow"
        Resource = aws_iam_role.ecs_instance.arn
        Condition = {
          StringLike = {
            "iam:PassedToService" = "ec2.*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_infrastructure" {
  role       = aws_iam_role.ecs_infrastructure.name
  policy_arn = aws_iam_policy.ecs_infrastructure.arn
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ssm_parameter" "stripe_secret_key" {
  name  = "/${local.name}/stripe/secret-key"
  type  = "SecureString"
  value = var.stripe_secret_key
  tags  = local.tags
}

resource "aws_ssm_parameter" "stripe_webhook_secret" {
  name  = "/${local.name}/stripe/webhook-secret"
  type  = "SecureString"
  value = var.stripe_webhook_secret
  tags  = local.tags
}

# The ECS agent resolves `secrets` (as opposed to plain `environment` vars) using the
# execution role, before the container starts — not the task's own application role.
resource "aws_iam_role_policy" "ecs_task_execution_ssm" {
  name = "${local.name}-ecs-task-execution-ssm"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "ssm:GetParameters"
        Effect = "Allow"
        Resource = [
          aws_ssm_parameter.stripe_secret_key.arn,
          aws_ssm_parameter.stripe_webhook_secret.arn,
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task_application" {
  name = "${local.name}-ecs-task-application-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "ecs_task_application" {
  name        = "${local.name}-ecs-task-application-policy"
  description = "Application runtime permissions for ECS tasks"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
        ]
        Effect   = "Allow"
        Resource = "${module.uploads_bucket.s3_bucket_arn}/*"
      },
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable"
        ]
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.products.arn,
          aws_dynamodb_table.owners.arn,
          aws_dynamodb_table.comments.arn,
          aws_dynamodb_table.ratings.arn,
          aws_dynamodb_table.conversations.arn,
          "${aws_dynamodb_table.conversations.arn}/index/*",
          aws_dynamodb_table.conversation_messages.arn,
          aws_dynamodb_table.notifications.arn,
          aws_dynamodb_table.offers.arn,
          aws_dynamodb_table.orders.arn,
          "${aws_dynamodb_table.orders.arn}/index/*",
          aws_dynamodb_table.favorites.arn,
          aws_dynamodb_table.reports.arn,
        ]
      },
      {
        Action = [
          "cognito-idp:SignUp",
          "cognito-idp:ConfirmSignUp",
          "cognito-idp:ResendConfirmationCode",
          "cognito-idp:InitiateAuth",
          "cognito-idp:RespondToAuthChallenge",
          "cognito-idp:ForgotPassword",
          "cognito-idp:ConfirmForgotPassword",
          "cognito-idp:ChangePassword",
          "cognito-idp:GetUser",
          "cognito-idp:AssociateSoftwareToken",
          "cognito-idp:VerifySoftwareToken",
          "cognito-idp:SetUserMFAPreference",
          "cognito-idp:RespondToAuthChallenge"
        ]
        Effect   = "Allow"
        Resource = aws_cognito_user_pool.app_users.arn
      },
      {
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
        ]
        Effect   = "Allow"
        Resource = aws_ses_domain_identity.notifications.arn
      },
      {
        # Rekognition's DetectModerationLabels has no resource-level permissions to scope to.
        Action   = "rekognition:DetectModerationLabels"
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_application" {
  role       = aws_iam_role.ecs_task_application.name
  policy_arn = aws_iam_policy.ecs_task_application.arn
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name}-api"
  requires_compatibilities = ["EC2"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_application.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${aws_ecr_repository.api.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = var.api_container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "ASPNETCORE_URLS", value = "http://+:${var.api_container_port}" },
        { name = "AWS_REGION", value = data.aws_region.current.region },
        { name = "Cognito__UserPoolId", value = aws_cognito_user_pool.app_users.id },
        { name = "Cognito__ClientId", value = aws_cognito_user_pool_client.app_users.id },
        { name = "Cognito__Region", value = data.aws_region.current.region },
        { name = "AwsResources__UsersTableName", value = aws_dynamodb_table.users.name },
        { name = "AwsResources__ProductsTableName", value = aws_dynamodb_table.products.name },
        { name = "AwsResources__OwnersTableName", value = aws_dynamodb_table.owners.name },
        { name = "AwsResources__CommentsTableName", value = aws_dynamodb_table.comments.name },
        { name = "AwsResources__RatingsTableName", value = aws_dynamodb_table.ratings.name },
        { name = "AwsResources__ConversationsTableName", value = aws_dynamodb_table.conversations.name },
        { name = "AwsResources__ConversationMessagesTableName", value = aws_dynamodb_table.conversation_messages.name },
        { name = "AwsResources__NotificationsTableName", value = aws_dynamodb_table.notifications.name },
        { name = "AwsResources__OffersTableName", value = aws_dynamodb_table.offers.name },
        { name = "AwsResources__OrdersTableName", value = aws_dynamodb_table.orders.name },
        { name = "AwsResources__FavoritesTableName", value = aws_dynamodb_table.favorites.name },
        { name = "AwsResources__ReportsTableName", value = aws_dynamodb_table.reports.name },
        { name = "AwsResources__UploadsBucketName", value = module.uploads_bucket.s3_bucket_id },
        { name = "AwsResources__PublicAssetsBaseUrl", value = "https://${local.frontend_domain}" },
        { name = "Cors__AllowedOrigin", value = "https://${local.frontend_domain}" },
        { name = "Ses__FromAddress", value = "notifications@${aws_ses_domain_identity.notifications.domain}" },
        { name = "Stripe__SuccessUrl", value = "https://${local.frontend_domain}/checkout/success?session_id={CHECKOUT_SESSION_ID}" },
        { name = "Stripe__CancelUrl", value = "https://${local.frontend_domain}/checkout/cancelled" },
      ]

      secrets = [
        { name = "Stripe__SecretKey", valueFrom = aws_ssm_parameter.stripe_secret_key.arn },
        { name = "Stripe__WebhookSecret", valueFrom = aws_ssm_parameter.stripe_webhook_secret.arn },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = data.aws_region.current.region
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])

  tags = local.tags
}

resource "aws_ecs_service" "api" {
  name            = "${local.name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.main.name
    weight            = 1
  }

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.api_container_port
  }

  depends_on = [aws_lb_listener.api_http]

  tags = local.tags
}
