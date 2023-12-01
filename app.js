const express = require('express');
const elasticsearch = require('elasticsearch');
const app = express();
const path = require('path');

require('dotenv').config();

// Elasticsearch client setup
const esClient = new elasticsearch.Client({
  host: 'https://search-elastic-domain-s3-vb4hmg4u24ozmwwbk2rdyrcxva.us-east-1.es.amazonaws.com',
  log: 'debug', // Change this to 'trace' for more detailed logging
  httpAuth: `${process.env.ELASTIC_USERNAME}:${process.env.ELASTIC_PASSWORD}`,
});

// Express route to handle GET requests for top-source-ips
app.get('/top-source-ips', async (req, res) => {
  try {
    const response = await esClient.search({
      index: 'cwl-*.*.*', // We will use wildcards to look at all logs coming from the S3 bucket.  
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              { match: { eventName: 'PutObject' } },
            ],
          },
        },
        aggs: {
          top_source_ips: {
            terms: {
              field: 'sourceIPAddress.keyword', // Use the .keyword subfield for aggregation
              size: 10, // specify the number of top IPs you want to retrieve
            },
          },
        },
      },
    });

    // Extract the top source IPs from the aggregation response
    const topSourceIPs = response.aggregations.top_source_ips.buckets.map(bucket => ({
      sourceIPAddress: bucket.key,
      count: bucket.doc_count,
    }));

    // Send the response with the top source IPs
    res.json(topSourceIPs);
  } catch (error) {
    console.error('Error querying Elasticsearch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve React app build output
app.use(express.static(path.join(__dirname, 'public')));

// Handle all other routes by serving the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app };
