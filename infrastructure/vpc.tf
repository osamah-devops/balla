locals {
  name = "ex-${basename(path.cwd)}"
  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

data "aws_region" "current" {}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs              = ["us-east-1a", "us-east-1b"]
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets   = ["10.0.11.0/24", "10.0.12.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24"]

  public_dedicated_network_acl = true
  public_inbound_acl_rules = [
    {
      rule_number = 100
      protocol    = "tcp"
      from_port   = 80
      to_port     = 80
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
    },
    {
      rule_number = 110
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
    },
    {
      # Return traffic for connections the NAT gateway proxies on behalf of the private subnets.
      rule_number = 120
      protocol    = "tcp"
      from_port   = 1024
      to_port     = 65535
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
    }
  ]

  public_outbound_acl_rules = [
    {
      rule_number = 100
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
    }
  ]

  private_dedicated_network_acl = true
  private_inbound_acl_rules = [
    {
      rule_number = 100
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      rule_action = "allow"
      cidr_block  = "10.0.0.0/16"
    },
    {
      # NACLs are stateless: return traffic for connections the private subnet initiates
      # outbound (via the NAT gateway) arrives from the real remote IP on an ephemeral
      # destination port, not from a VPC-internal address. Without this, nothing in the
      # private subnet can complete an outbound TCP connection (ECS/SSM agent check-in,
      # ECR/package pulls, etc.) even though egress and routing are both fine.
      rule_number = 110
      protocol    = "tcp"
      from_port   = 1024
      to_port     = 65535
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
    },
  ]
  private_outbound_acl_rules = [
    {
      rule_number = 100
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
    }
  ]
  create_database_subnet_group           = true
  create_database_subnet_route_table     = true
  create_database_internet_gateway_route = true

  enable_nat_gateway = true
  single_nat_gateway = true
  enable_vpn_gateway = false

  tags = local.tags
}

module "logs_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket_prefix = "${local.name}-logs-"
  force_destroy = true

  # Policy works for flow logs as well
  attach_waf_log_delivery_policy = true

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name_prefix = "/aws/flow-log/vpc/${module.vpc.vpc_id}/${local.name}-external-"

  retention_in_days = 7

  tags = local.tags
}

resource "aws_iam_role" "flow_log_cloudwatch" {
  name_prefix = "${local.name}-external-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = "VPCFlowLogsAssume"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      },
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "flow_log_cloudwatch" {
  name_prefix = "${local.name}-external-"
  role        = aws_iam_role.flow_log_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
        ]
        Effect   = "Allow"
        Resource = aws_cloudwatch_log_group.flow_log.arn
      },
    ]
  })
}

resource "aws_flow_log" "cloudwatch_external" {
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.flow_log.arn
  iam_role_arn         = aws_iam_role.flow_log_cloudwatch.arn
  traffic_type         = "ALL"
  vpc_id               = module.vpc.vpc_id

  tags = local.tags
}

resource "aws_flow_log" "s3_external" {
  vpc_id               = module.vpc.vpc_id
  log_destination_type = "s3"
  log_destination      = module.logs_bucket.s3_bucket_arn
  traffic_type         = "ALL"
}
