// Create service client module using ES6 syntax.
import { S3Client } from "@aws-sdk/client-s3";
import { RekognitionClient } from "@aws-sdk/client-rekognition";
// Set the AWS Region.
const REGION = "eu-central-1"; //e.g. "us-east-1"
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: REGION });

const rekoClient = new RekognitionClient({ region: REGION });

export { s3Client, rekoClient };