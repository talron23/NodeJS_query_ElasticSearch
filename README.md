# Node.js API for Querying ElasticSearch
## Overview

This project aims to audit and analyze S3 bucket access using AWS CloudTrail, ElasticSearch, and Node.js Express. It includes processes for sending audit logs to another S3 bucket, ingesting logs into ElasticSearch, creating visualizations in Kibana, and building an API to query top source IPs for PutObject requests.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Stream Log data to Amazon OpenSearch domain](#stream-log-data-to-amazon-opensearch-domain)
- [ElasticSearch and Kibana Setup](#elasticsearch-and-kibana-setup)
- [Node.js Express API](#nodejs-express-api)
- [Setup the Node.js server](#setup-the-nodejs-server)
- [Continous Integration and Tests](#continous-integration-and-tests)


## Prerequisites

- AWS Account with an S3 bucket

## Stream Log data to Amazon OpenSearch domain
Our goal is to analyze S3 bucket audit logs. Therefore, we are starting by making sure we have an S3 bucket.

### CloudTrail

We'll use cloudtrail to store all the audit logs of the S3 bucket in a new bucket. 
When creating the trail, we will configure a KMS key in order to make sure our logs files will be encrypted:

![KMS](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/b6aeb5eb-d4ae-477e-b1e6-90a607aaebe6|width=80)

Enable CloudWatch logs to integrating them with the trail so that CloudWatch can monitor the trail logs and send them to the ElasticSearch cluster:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/48b84af4-5c7d-4ffe-bdab-89044dd527aa|width=80)

For the event type, our aim is to analze only the audit logs of an S3 bucket, so select only "Data events":

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/6c27f3ae-5bea-40e2-ac8c-2465016b0691|width=80)

We will reduce costs and logging events by choosing S3 as the data event source, and select only a specific S3 bucket we wish to analyze:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/7a431964-25d7-4ddb-b506-40ccd83ad275|width=80)

Click next and create the trail. 


### Amazon OpenSearch Service

Navigate to the OpenSearch Service on AWS console and create a new domain. 
In order to go through the limits of AWS free tier, we will use a basic testing deployment running only on one AZ.

We will use a General Purpose t3.small.search instance type for our date node, as it's included under AWS free tier. 
Avoid using T2 instance types as they do not support encryption at rest. 
We will deploy a single node with 20 GiB of storage size to align with the free tier limits. 

We will make our ElasticSearch cluster public, securing it with Fine-grained access control by creating role mappings on the ElasticSearch domain. 

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/3a781a3c-f086-40cc-9abb-f93059fb8670|width=80)

With fine-grained access control enabled, we will have HTTPS security, node-to-node encryption, and encryption at rest enabled.

Proceed with all the default settings and create the OpenSearch cluster. It will take 15-20 minutes for it to be completed. 


### CloudWatch 

While waiting for the provisiong for the cluster, we will go on creating a CloudWatch log group to stream data in near real time to our domain using CloudWatch subscription. 

Go to the CloudWatch log groups and select the cloudtrail log group which was automatically created when we created the trail. Create a subscription for this group:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/4f915786-e44f-44f6-9266-ce52c39d134d|width=80)

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

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/a0fd638f-1245-4361-9661-3e773de15814|width=80)

Click "Start streaming". 


## ElasticSearch and Kibana Setup

Go to the Amazon OpenSearch service and access the Kibana URL of our domain. Login with the master user you configured earlier. 
Define an index pattern to fit with the logs coming from CloudWatch:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/1e6eec2b-0c77-45ff-a354-11772a802079|width=80)

Select the @timestamp attribute as primary time field for use with the global time filter, and create the index pattern:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/2bc57ddd-d9b6-4098-97af-57aa267a39c0|width=80)

We can now start exploring the logs coming to ElasticSearch at the 'Discover' tab. 
Click on "Add filter" and configure it accordingly with the events you wish to further observe. Our goal is to find out top most source IPs with PutObject event:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/dfbf9aa0-2f21-4c24-b3b3-e232705d4d65|width=80)

We will use this data to create a kibana visualization. Save this report by clicking 'save' at the top menu:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/505c9b7e-d1c2-4fd8-abb8-1e1f8b13ee90|width=80)

Go to the 'Visualize' and proceed with creating a visualization. Choose your desired visualization type and select the filtered report we saved:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/16022206-ce3e-4824-af91-dc2de084675a|width=80)

Configure the visualization filter to show the source IP address ordered by count:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/fbd16733-5ff2-47c6-bde4-0f4637638041|width=80)

Save the visualization, and go on to the 'Dashbaoards' tab to create a Dashboard. 
Click on "Add an existing" and choose the visualization we just created:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/ceabe714-4ea6-4d2e-b5b5-a28013c7a9a8|width=80)

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

ELASTIC_USERNAME: Username for ElasticSearch authentication
ELASTIC_PASSWORD: Password for ElasticSearch authentication
PORT: Port on which the API server will listen (default is 3000)

For security purposes, ensure that Elasticsearch authentication credentials (ELASTIC_USERNAME and ELASTIC_PASSWORD) are kept secure and are not included in the code.
Set up the required environment variables by creating a .env file or directly in your environment.

## Setup the Node.js server
We will set up our API server on an EC2 instance with ubuntu 22.04, running it secured with HTTPS behind an Application Load Balancer.
Configure a Target Group of 'Instances' type for our EC2 instance. Choose HTTPS:443 for our protocol, and place it in the same VPC as our EC2 instance. 

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/300a35bf-6f9a-4009-9cb2-905ddd6a6186|width=80)

For the Health Check, we will need to override the default settings and configure the 3000 port which our API server listens on as the Health check port.
Choose /top-source-ips, as the path, and keep the HTTP success code to '200'. 
Click next to move on to the 'Register targets' step. Choose our EC2 instance - register it and create the Target Group.

On the EC2 dashboard, create an Application Load Balancer. Make it internet facing and configure it in the same VPC and AZ where our EC2 instance lies. 
Create a Security Group for the ALB which listens on HTTPS only:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/98baddbd-06ef-40a1-98d4-b825be0354fb|width=80)

Our API lisetens on port 3000 but the Load Balancer will accept only HTTPS connections and reach our backend API at port 3000.
Similiary to this setup, the seucrity group of our EC2 instance will need to accept only inbound rule for TCP Port 3000, coming from the ALB security group we created. 
It does not need to accept HTTPS connections as it will only get requests from the ALB on port 3000. 

Move on with creating an HTTPS:443 listener, choosing the Target Group we created.
Choose an SSL certificate which will be attached to the Load Balancer:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/8741bafa-085f-42bf-9185-b699b6b0315c|width=80)

If you don't have a certificate, go to the AWS Certificate Manager, and request a public SSL certificate for a domain you own. You can register a domain on Route 53 or other vendors. 

Click on 'Create Load Balancer' after reviewing all the settings are correct. 

After our Load Balancer is ready, go ahead and create a DNS Alias record on Route 53 for the Load Balancer:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/89686c74-ee1f-4557-85e6-b3dcaca42b91|width=80)

Now we can reach our API on the DNS record we configured. 

Make sure to install depedencies on the EC2 instance by running 
```
npm install
```
And our application is ready to go! Another step to make our app more reliable would be configruing it as a service in /etc/systemd/system/nodeapp.service:
  ```
[Unit]
Description=Node.js App

[Service]
ExecStart=/usr/bin/node /home/ubuntu/node_app/app.js
Restart=always
User=ubuntu
Group=ubuntu
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/home/ubuntu/node_app

[Install]
WantedBy=multi-user.target
  ```

Run and enable the service to make it run on boot:
  ```
sudo systemctl daemon-reload
sudo systemctl enable your-service-name
sudo systemctl start your-service-name
  ```

Verify the service is running correctly:

![image](https://github.com/talron23/NodeJS_query_ElasticSearch/assets/108025960/1be80613-e510-4e5a-9088-25b6ce6cb5fc)

## Continous Integration and Tests using GitHub Actions
[Details on setting up Continous Integration with GitHub Actions and running tests.]

