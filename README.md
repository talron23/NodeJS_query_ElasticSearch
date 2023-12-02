# NodeJS API to query ElasticSerach
## Overview

This project aims to audit and analyze S3 bucket access using AWS CloudTrail, ElasticSearch, and Node.js Express. It includes processes for sending audit logs to another S3 bucket, ingesting logs into ElasticSearch, creating visualizations in Kibana, and building an API to query top source IPs for PutObject requests.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Stream Log data to Amazon OpenSearch domain](#stream-log-data-to-amazon-opensearch-domain)
- [ElasticSearch Setup](#elasticsearch-setup)
- [Node.js Express API](#nodejs-express-api)
- [Kibana Visualization](#kibana-visualization)
- [Continous Integration and Tests](#continous-integration-and-tests)


## Prerequisites

- AWS Account with an S3 bucket

## Stream Log data to Amazon OpenSearch domain
Our goal is to analyze S3 bucket audit logs. Therefore, we are starting by making sure we have an S3 bucket.

### CloudTrail
We'll use cloudtrail to store all the audit logs of the S3 bucket in a new bucket. 
When creating the trail, we will configure a KMS key in order to make sure our logs files will be encrypted:

![KMS](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/b6aeb5eb-d4ae-477e-b1e6-90a607aaebe6)

Enable CloudWatch logs to integrating them with the trail so that CloudWatch can monitor the trail logs and send them to the ElasticSearch cluster. 

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/48b84af4-5c7d-4ffe-bdab-89044dd527aa)

For the event type, our aim is to analze only the audit logs of an S3 bucket, so select only "Data events":

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/6c27f3ae-5bea-40e2-ac8c-2465016b0691)

We will reduce costs and logging events by choosing S3 as the data event source, and select only a specific S3 bucket we wish to analyze:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/7a431964-25d7-4ddb-b506-40ccd83ad275)

Click next and create the trail. 

### Amazon OpenSearch Service

Navigate to the OpenSearch Service on AWS console and create a new domain. 
In order to go through the limits of AWS free tier, we will use a basic testing deployment running only on one AZ.

We will use a General Purpose t3.small.search instance type for our date node, as it's included under AWS free tier. 
Avoid using T2 instance types as they do not support encryption at rest. 
We will deploy a single node with 20 GiB of storage size to align with the free tier limits. 

We will make our ElasticSearch cluster public, securing it with Fine-grained access control by creating role mappings on the ElasticSearch domain. 

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/3a781a3c-f086-40cc-9abb-f93059fb8670)

With fine-grained access control enabled, we will have HTTPS security, node-to-node encryption, and encryption at rest enabled.

Proceed with all the default settings and create the OpenSearch cluster. It will take 15-20 minutes for it to be completed. 

### CloudWatch 

While waiting for the provisiong for the cluster, we will go on creating a CloudWatch log group to stream data in near real time to our domain using CloudWatch subscription. 

Go to the CloudWatch log groups and select the cloudtrail log group which was automatically created when we created the trail. Create a subscription for this group:
![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/4f915786-e44f-44f6-9266-ce52c39d134d)

The delivery of the logs to the ElasticSearch domain will be done using Lambda, and as such, we also need to create an IAM role for the Lambda execution. 
We want to limit the Labmda function with OpenSearch Service access only to our specific domain. 
Go to IAM -> Policies -> Create Policy -> Paste the following JSON (Replace the resource with your domain ARN of the OpenSearch cluster):
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "es:*"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:es:us-east-1:371029671060:domain/elastic-domain-s3/*"
        }
    ]
}
```
Create the policy and go on to create the IAM role - select "Labmda" as the service. Click next and choose the policy we just created. 
Along that, you might need to also add the AWSLambdaBasicExecutionRole policy, if you wish to enable logs on the lambda function. 

Go back to the CloudWatch subscription creation and choose the IAM role we just created for the Lambda execution. 

Choose "CloudTrail" for the log format and keep the filter empty:
![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/a0fd638f-1245-4361-9661-3e773de15814)

Click "Start streaming". 

## ElasticSearch Setup
[Details on setting up ElasticSearch and Kibana, indexing data, etc.]

Node.js Express API
[Details on setting up and running the Node.js Express API, API endpoints, etc.]

Kibana Visualization
[Instructions on creating visualizations in Kibana for PutObject requests by source IP.]

Continous Integration and Tests
[Details on setting up Continous Integration with GitHub Actions and running tests.]

