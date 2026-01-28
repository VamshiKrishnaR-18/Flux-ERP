# ADR 0001: Adoption of Serverless Architecture

## Status
Accepted

## Context
We are migrating a legacy Express monolithic ERP. We have a requirement for zero idle costs (Free Tier) while maintaining high scalability for bursty invoicing traffic.

## Decision
We will use **AWS Lambda** with **Serverless Framework** instead of containers.

## Consequences
* **Positive:** $0 cost when not in use. 
* **Negative:** Cold start latency (acceptable for internal ERP).