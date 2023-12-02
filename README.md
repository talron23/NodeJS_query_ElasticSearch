# NodeJS API to query ElasticSerach
## Overview

This project aims to audit and analyze S3 bucket access using AWS CloudTrail, ElasticSearch, and Node.js Express. It includes processes for sending audit logs to another S3 bucket, ingesting logs into ElasticSearch, creating visualizations in Kibana, and building an API to query top source IPs for PutObject requests.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Stream Log data to Amazon OpenSearch domain](#stream-log-data-to-amazon-opensearch-domain)
- [ElasticSearch and Kibana Setup](#elasticsearch-and-kibana-setup)
- [Node.js Express API](#nodejs-express-api)
- [Continous Integration and Tests](#continous-integration-and-tests)


## Prerequisites

- AWS Account with an S3 bucket

## Stream Log data to Amazon OpenSearch domain
Our goal is to analyze S3 bucket audit logs. Therefore, we are starting by making sure we have an S3 bucket.


### CloudTrail

We'll use cloudtrail to store all the audit logs of the S3 bucket in a new bucket. 
When creating the trail, we will configure a KMS key in order to make sure our logs files will be encrypted:

![KMS](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/b6aeb5eb-d4ae-477e-b1e6-90a607aaebe6)

Enable CloudWatch logs to integrating them with the trail so that CloudWatch can monitor the trail logs and send them to the ElasticSearch cluster:

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
Proceed with choosing "CloudTrail" for the log format and keep the filter empty:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/a0fd638f-1245-4361-9661-3e773de15814)

Click "Start streaming". 


## ElasticSearch and Kibana Setup

Go to the Amazon OpenSearch service and access the Kibana URL of our domain. Login with the master user you configured earlier. 
Define an index pattern to fit with the logs coming from CloudWatch:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/1e6eec2b-0c77-45ff-a354-11772a802079)

Select the @timestamp attribute as primary time field for use with the global time filter, and create the index pattern:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/2bc57ddd-d9b6-4098-97af-57aa267a39c0)

We can now start exploring the logs coming to ElasticSearch at the 'Discover' tab. 
Click on "Add filter" and configure it accordingly with the events you wish to further observe. Our goal is to find out top most source IPs with PutObject event:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/dfbf9aa0-2f21-4c24-b3b3-e232705d4d65)

We will use this data to create a kibana visualization. Save this report by clicking 'save' at the top menu:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/505c9b7e-d1c2-4fd8-abb8-1e1f8b13ee90)

Go to the 'Visualize' and proceed with creating a visualization. Choose your desired visualization type and select the filtered report we saved:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/16022206-ce3e-4824-af91-dc2de084675a)

Configure the visualization filter to show the source IP address ordered by count:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/fbd16733-5ff2-47c6-bde4-0f4637638041)

Save the visualization, and go on to the 'Dashbaoards' tab to create a Dashboard. 
Click on "Add an existing" and choose the visualization we just created:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/ceabe714-4ea6-4d2e-b5b5-a28013c7a9a8)

There we go. Our Kibana dashboard is set. Don't forget to save it by clicking 'save' at the top menu. 


## Node.js Express API


This Node.js Express API provides endpoints for querying and retrieving information from an Elasticsearch cluster that stores CloudTrail logs. The API is designed to expose specific information related to S3 bucket access events, specifically focusing on the "PutObject" events.

### API Endpoints

#### Get Top Source IPs for PutObject Events

- **Endpoint:** `/top-source-ips`
- **Method:** `GET`
- **Description:** Retrieves the top source IP addresses associated with "PutObject" events in the CloudTrail logs stored in Elasticsearch.
- **Request Parameters:** None
- **Example Request:**
```
  curl http://localhost:3000/top-source-ips
```

   Example Response:
  ```
[
{"sourceIPAddress":"77.138.24.9","count":32},
{"sourceIPAddress":"109.253.185.10","count":10},
  // ... additional entries
]
```


#### Variables Configuration
The API requires the following environment variables to be configured:

ELASTIC_USERNAME: Username for ElasticSearch authentication.
ELASTIC_PASSWORD: Password for ElasticSearch authentication.
PORT: Port on which the API server will listen (default is 3000).

For security purposes, ensure that Elasticsearch authentication credentials (ELASTIC_USERNAME and ELASTIC_PASSWORD) are kept secure and are not included in the code.
Set up the required environment variables by creating a .env file or directly in your environment.

## Setup the Node.js server


## Continous Integration and Tests using GitHub Actions
[Details on setting up Continous Integration with GitHub Actions and running tests.]

