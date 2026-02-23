provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "freight_cluster" {
  name = "infamous-freight"
}

resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine               = "postgres"
  instance_class       = "db.t3.micro"
  db_name              = "freight"
  username             = "freight"
  password             = "securepassword"
  skip_final_snapshot  = true
  publicly_accessible  = false
  backup_retention_period = 7
}
