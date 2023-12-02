# NodeJS app to query S3 Bucket Access Audit logs, using Kibana and ElasticSearch
## Overview

This project aims to audit and analyze S3 bucket access using AWS CloudTrail, ElasticSearch, and Node.js Express. It includes processes for sending audit logs to another S3 bucket, ingesting logs into ElasticSearch, creating visualizations in Kibana, and building an API to query top source IPs for PutObject requests.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Stream Log data to Amazon OpenSearch domain](#aws-configuration)
- [ElasticSearch Setup](#elasticsearch-setup)
- [Node.js Express API](#nodejs-express-api)
- [Kibana Visualization](#kibana-visualization)
- [Continous Integration and Tests](#continous-integration-and-tests)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- AWS Account

## AWS Configuration
Our goal is to analyze S3 bucket audit logs. Therefore, we are starting by making sure we have an S3 bucket, and we'll use cloudtrail to create a new S3 bucket for all audit logs on the S3 bucket we want to analyze. 

ElasticSearch Setup
[Details on setting up ElasticSearch and Kibana, indexing data, etc.]

Node.js Express API
[Details on setting up and running the Node.js Express API, API endpoints, etc.]

Kibana Visualization
[Instructions on creating visualizations in Kibana for PutObject requests by source IP.]

Continous Integration and Tests
[Details on setting up Continous Integration with GitHub Actions and running tests.]

Security Considerations
[Explanation of implemented security measures, considerations for AWS services, etc.]