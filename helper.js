// Create service client module using ES6 syntax.
import { S3Client } from "@aws-sdk/client-s3";
import { RekognitionClient } from "@aws-sdk/client-rekognition";
import { REGION } from "./s3info.js";
// Set the AWS Region.
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: REGION });

const rekoClient = new RekognitionClient({ region: REGION });

export { s3Client, rekoClient };