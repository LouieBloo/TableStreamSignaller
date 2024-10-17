// Import modules using ES6 syntax
import http from 'http';

// Lambda handler
export const handler = async (event) => {
    try {
        // Check if the incoming request body is Base64-encoded
        let postData;
        if (event.isBase64Encoded) {
            postData = Buffer.from(event.body, 'base64');
        } else {
            postData = event.body;
        }

        // Define the options for the HTTP request to the Fargate container
        const options = {
            hostname: '52.34.48.45', // Replace with the dynamic IP
            port: 8080,                       // Port on which the Fargate container listens
            path: '/classify',                // Path of the endpoint on your container
            method: event.httpMethod || 'POST',
            headers: {
                ...event.headers,
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        // Return a promise that sends the HTTP request
        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';

                // Collect data chunks
                res.on('data', (chunk) => {
                    data += chunk;
                });

                // Resolve the promise once the response ends
                res.on('end', () => {
                    console.log("END")
                    //const responseBody = Buffer.concat(data).toString('base64');
                    console.log("body")
                    console.log(data)
                    console.log("headers")
                    console.log(res.headers)
                    console.log(res.statusCode)
                    resolve({
                        statusCode: 200,
                        body: data,  // Send the response body directly
                    });
                });
            });

            // Handle errors with the request
            req.on('error', (e) => {
                reject({
                    statusCode: 500,
                    body: `Problem with request: ${e.message}`,
                });
            });

            // Write the form data to the request body
            req.write(postData);

            // End the request
            req.end();
        });

        console.log(JSON.stringify(response))

        return response;
    } catch (error) {
        return {
            statusCode: 500,
            body: `Error: ${error.message}`,
        };
    }
};
